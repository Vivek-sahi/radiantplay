import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { c, sp, fs, fw, ff } from '../styles';
import { ISSUES, ISSUE_META, MODEL, Issue } from '../data/mockData';

// ── Types ─────────────────────────────────────────────────────────────────────

type WizardStep = 1 | 2 | 3;
type JobStatus = 'pending' | 'running' | 'success' | 'failed';

interface JobResult {
  issue: Issue;
  status: JobStatus;
  error?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtNumber = (n: number) => n.toLocaleString();

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' at '
    + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

// ── Step indicator ────────────────────────────────────────────────────────────

// ── Tooltip (portal) ──────────────────────────────────────────────────────────

const Tooltip: React.FC<{ text: string }> = ({ text }) => {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const ref = useRef<HTMLSpanElement>(null);
  return (
    <span
      ref={ref}
      style={{ display: 'inline-flex', alignItems: 'center', cursor: 'default' }}
      onMouseEnter={() => {
        if (ref.current) {
          const r = ref.current.getBoundingClientRect();
          setPos({ x: r.left + r.width / 2, y: r.top });
        }
      }}
      onMouseLeave={() => setPos(null)}
    >
      <span style={{ fontSize: 10, color: c['content-tertiary'] }}>ⓘ</span>
      {pos && createPortal(
        <span style={{
          position: 'fixed', left: pos.x, top: pos.y - 6,
          transform: 'translate(-50%, -100%)',
          backgroundColor: c['background-base-inverse'], color: c['content-primary-inverse'],
          borderRadius: 4, padding: '4px 8px',
          fontSize: 11, whiteSpace: 'nowrap', zIndex: 9999,
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)', pointerEvents: 'none',
        }}>{text}</span>,
        document.body
      )}
    </span>
  );
};

// ── Step 1: Issues + editable fixes ──────────────────────────────────────────

const Step1: React.FC<{
  issues: Issue[];
  selected: Set<string>;
  fixValues: Record<string, string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onFixChange: (id: string, val: string) => void;
}> = ({ issues, selected, fixValues, onToggle, onToggleAll, onFixChange }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftValue, setDraftValue] = useState('');
  const allChecked = issues.every(i => selected.has(i.id));

  const startEdit = (issue: Issue, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(issue.id);
    setDraftValue(fixValues[issue.id] ?? issue.fixValue);
  };

  const commitEdit = (id: string) => {
    onFixChange(id, draftValue.trim() || ISSUES.find(i => i.id === id)!.fixValue);
    setEditingId(null);
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: fs.sm }}>
        <thead>
          <tr style={{ backgroundColor: c['background-subtle'], position: 'sticky', top: 0, zIndex: 1 }}>
            <th style={{ padding: `${sp.B}px ${sp.D}px`, width: 36, borderBottom: `1px solid ${c['border-divider']}` }}>
              <input
                type="checkbox" checked={allChecked} onChange={onToggleAll}
                style={{ cursor: 'pointer', accentColor: c['content-brand'] }}
              />
            </th>
            <th style={thStyle}>Column</th>
            <th style={thStyle}>Issue type</th>
            <th style={thStyle}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: sp.A }}>
                Affected rows
              </span>
            </th>
            <th style={thStyle}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: sp.A }}>
                Fix value
                <Tooltip text="AI-suggested fix value. Click ✎ to edit before applying." />
              </span>
            </th>
            <th style={thStyle}>Why</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue, i) => {
            const meta      = ISSUE_META[issue.issueType];
            const isChecked = selected.has(issue.id);
            const isEditing = editingId === issue.id;
            const fixVal    = fixValues[issue.id] ?? issue.fixValue;
            const isCustom  = fixVal !== issue.fixValue;

            return (
              <tr
                key={issue.id}
                onClick={() => onToggle(issue.id)}
                style={{
                  backgroundColor: isChecked
                    ? '#eff6ff'
                    : i % 2 === 0 ? c['background-base'] : c['background-sunken'],
                  cursor: 'pointer',
                }}
              >
                {/* Checkbox */}
                <td style={tdStyle} onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox" checked={isChecked} onChange={() => onToggle(issue.id)}
                    style={{ cursor: 'pointer', accentColor: c['content-brand'] }}
                  />
                </td>

                {/* Column */}
                <td style={tdStyle}>
                  <div style={{ fontWeight: fw.medium, color: c['content-primary'] }}>{issue.columnName}</div>
                  <div style={{ fontSize: fs.xs, color: c['content-secondary'], marginTop: 1 }}>{issue.table}</div>
                </td>

                {/* Issue type */}
                <td style={tdStyle}>
                  <span style={{
                    fontSize: 11, fontWeight: fw.medium,
                    color: meta.color, backgroundColor: meta.bg,
                    borderRadius: 3, padding: '2px 6px',
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                  }}>
                    {meta.icon} {meta.label}
                  </span>
                </td>

                {/* Affected rows */}
                <td style={{ ...tdStyle, fontSize: fs.xs, color: c['content-secondary'] }}>
                  {fmtNumber(issue.affectedRows)}
                  <span style={{ color: c['content-tertiary'], marginLeft: 3 }}>
                    ({issue.affectedPct < 0.1 ? '<0.1' : issue.affectedPct.toFixed(1)}%)
                  </span>
                </td>

                {/* Fix value — editable */}
                <td style={tdStyle} onClick={e => e.stopPropagation()}>
                  {isEditing ? (
                    <input
                      autoFocus
                      value={draftValue}
                      onChange={e => setDraftValue(e.target.value)}
                      onBlur={() => commitEdit(issue.id)}
                      onKeyDown={e => { if (e.key === 'Enter') commitEdit(issue.id); if (e.key === 'Escape') setEditingId(null); }}
                      style={{
                        width: '100%', padding: '3px 6px',
                        border: `1px solid ${c['border-brand']}`,
                        borderRadius: 4, fontSize: fs.xs,
                        fontFamily: 'monospace', outline: 'none',
                        backgroundColor: c['background-base'],
                        color: c['content-primary'],
                      }}
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
                      <code style={{
                        fontSize: 11, fontFamily: 'monospace',
                        color: isCustom ? c['content-brand'] : c['content-primary'],
                        backgroundColor: isCustom ? '#dbeafe' : c['background-subtle'],
                        borderRadius: 3, padding: '1px 5px',
                        maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        display: 'block',
                      }}>
                        {fixVal}
                      </code>
                      {isCustom && (
                        <span style={{ fontSize: 9, color: c['content-brand'], fontWeight: fw.semibold }}>EDITED</span>
                      )}
                      <button
                        onClick={e => startEdit(issue, e)}
                        title="Edit fix value"
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: c['content-tertiary'], fontSize: 11, padding: 2,
                          lineHeight: 1, flexShrink: 0,
                        }}
                      >✎</button>
                    </div>
                  )}
                </td>

                {/* Why */}
                <td style={{ ...tdStyle, fontSize: fs.xs, color: c['content-secondary'], maxWidth: 180 }}>
                  {issue.recommendation}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ── Step 2: Job status ────────────────────────────────────────────────────────

const Step2: React.FC<{
  jobResults: JobResult[];
  fixValues: Record<string, string>;
  running: boolean;
}> = ({ jobResults, fixValues, running }) => {
  const total   = jobResults.length;
  const done    = jobResults.filter(j => j.status === 'success' || j.status === 'failed').length;
  const success = jobResults.filter(j => j.status === 'success').length;
  const failed  = jobResults.filter(j => j.status === 'failed').length;
  const allDone = !running && done === total;

  if (!allDone) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: sp.D }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: `3px solid ${c['border-divider']}`,
          borderTopColor: c['background-brand'],
          animation: 'spin 0.8s linear infinite',
        }} />
        <div style={{ fontSize: fs.sm, color: c['content-secondary'] }}>Applying fixes…</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {/* Summary banner */}
      <div style={{
        padding: `${sp.C}px ${sp.D}px`, marginBottom: sp.D,
        backgroundColor: failed > 0 ? c['background-warning'] : c['background-success'],
        display: 'flex', alignItems: 'center', gap: sp.C,
        borderRadius: 8, border: `1px solid ${failed > 0 ? '#fcd34d' : '#86efac'}`,
      }}>
        <span style={{ fontSize: 18 }}>{failed > 0 ? '⚠' : '✓'}</span>
        <div>
          <div style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'] }}>
            {success} of {total} operation{total !== 1 ? 's' : ''} applied successfully{failed > 0 && ` · ${failed} failed`}
          </div>
          <div style={{ fontSize: fs.xs, color: c['content-secondary'], marginTop: 2 }}>
            {failed > 0
              ? `The ${failed} failed operation${failed !== 1 ? 's' : ''} will not be scheduled. Review the errors below.`
              : 'All operations will be scheduled to run on every cache refresh.'}
          </div>
        </div>
      </div>

      {/* Results table — same structure as Step 1 */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: fs.sm }}>
        <thead>
          <tr style={{ backgroundColor: c['background-subtle'], position: 'sticky', top: 0, zIndex: 1 }}>
            <th style={{ ...thStyle, width: 36 }}></th>
            <th style={thStyle}>Column</th>
            <th style={thStyle}>Issue type</th>
            <th style={thStyle}>Affected rows</th>
            <th style={thStyle}>Fix value</th>
            <th style={thStyle}>Result</th>
          </tr>
        </thead>
        <tbody>
          {jobResults.map((job, i) => {
            const meta   = ISSUE_META[job.issue.issueType];
            const fixVal = fixValues[job.issue.id] ?? job.issue.fixValue;
            const rowBg  = job.status === 'failed'  ? '#fff8f8'
                         : job.status === 'success' ? '#f0fdf4'
                         : i % 2 === 0 ? c['background-base'] : c['background-sunken'];
            return (
              <tr key={job.issue.id} style={{ backgroundColor: rowBg }}>
                <td style={{ ...tdStyle, textAlign: 'center', width: 36 }}>
                  {job.status === 'success' && <span style={{ fontSize: 13, color: c['content-success'] }}>✓</span>}
                  {job.status === 'failed'  && <span style={{ fontSize: 13, color: c['content-failure'] }}>✕</span>}
                </td>
                <td style={tdStyle}>
                  <div style={{ fontWeight: fw.medium, color: c['content-primary'] }}>{job.issue.columnName}</div>
                  <div style={{ fontSize: fs.xs, color: c['content-secondary'], marginTop: 1 }}>{job.issue.table}</div>
                </td>
                <td style={tdStyle}>
                  <span style={{
                    fontSize: 11, fontWeight: fw.medium,
                    color: meta.color, backgroundColor: meta.bg,
                    borderRadius: 3, padding: '2px 6px',
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                  }}>
                    {meta.icon} {meta.label}
                  </span>
                </td>
                <td style={{ ...tdStyle, fontSize: fs.xs, color: c['content-secondary'] }}>
                  {fmtNumber(job.issue.affectedRows)}
                  <span style={{ color: c['content-tertiary'], marginLeft: 3 }}>
                    ({job.issue.affectedPct < 0.1 ? '<0.1' : job.issue.affectedPct.toFixed(1)}%)
                  </span>
                </td>
                <td style={tdStyle}>
                  <code style={{
                    fontSize: 11, fontFamily: 'monospace',
                    color: c['content-primary'], backgroundColor: c['background-subtle'],
                    borderRadius: 3, padding: '1px 5px',
                    maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    display: 'block',
                  }}>
                    {fixVal}
                  </code>
                </td>
                <td style={{ ...tdStyle, fontSize: fs.xs }}>
                  {job.status === 'success' && (
                    <span style={{ color: c['content-success'] }}>✓ {fmtNumber(job.issue.affectedRows)} rows fixed</span>
                  )}
                  {job.status === 'failed' && (
                    <span style={{ color: c['content-failure'] }}>{job.error}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ── Step 3: Schedule (read-only) ──────────────────────────────────────────────

const Step3: React.FC<{ jobResults: JobResult[] }> = ({ jobResults }) => {
  const scheduled = jobResults.filter(j => j.status === 'success');
  const failed    = jobResults.filter(j => j.status === 'failed');

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingTop: sp.D }}>
      <div style={{
        padding: `${sp.D}px ${sp.F}px`, borderRadius: 8,
        backgroundColor: c['background-subtle'],
        border: `1px solid ${c['border-divider']}`,
        display: 'flex', alignItems: 'center', gap: sp.H,
      }}>
        {[
          { label: 'Schedule',              value: MODEL.cacheScheduleLabel },
          { label: 'Next run',              value: fmtDate(MODEL.nextCacheAt) },
          { label: 'Operations scheduled',  value: String(scheduled.length) },
          ...(failed.length > 0 ? [{ label: 'Not scheduled', value: String(failed.length), warn: true }] : []),
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontSize: fs.xs, color: c['content-secondary'] }}>{item.label}</div>
            <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: (item as { warn?: boolean }).warn ? c['content-warning'] : c['content-primary'] }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Shared table cell styles ──────────────────────────────────────────────────

const thStyle: React.CSSProperties = {
  padding: `${sp.B}px ${sp.D}px`,
  textAlign: 'left', fontSize: fs.xs, fontWeight: fw.medium,
  color: c['content-secondary'],
  borderBottom: `1px solid ${c['border-divider']}`,
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: `${sp.C}px ${sp.D}px`,
  borderBottom: `1px solid ${c['border-divider']}`,
  verticalAlign: 'middle',
};

// ── Button styles ─────────────────────────────────────────────────────────────

// ── PrepWizard ────────────────────────────────────────────────────────────────

interface PrepWizardProps {
  onClose: () => void;
  onDone: () => void;
}

const TOTAL_STEPS = 3;

const stepMeta: Record<WizardStep, { context: string; title: string; subtitle?: string }> = {
  1: { context: 'Prep data · Step 1 of 3', title: 'Review issues' },
  2: { context: 'Prep data · Step 2 of 3', title: 'Applying fixes' },
  3: { context: 'Prep data · Step 3 of 3', title: 'Operations scheduled' },
};

const PrepWizard: React.FC<PrepWizardProps> = ({ onClose, onDone }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [step, setStep]           = useState<WizardStep>(1);
  const [selected, setSelected]   = useState<Set<string>>(new Set(ISSUES.map(i => i.id)));
  const [fixValues, setFixValues] = useState<Record<string, string>>(
    Object.fromEntries(ISSUES.map(i => [i.id, i.fixValue]))
  );
  const [jobResults, setJobResults] = useState<JobResult[]>([]);
  const [running, setRunning]       = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsAnalyzing(false), 2500);
    return () => clearTimeout(t);
  }, []);

  const selectedList   = ISSUES.filter(i => selected.has(i.id));
  const scheduledCount = jobResults.filter(j => j.status === 'success').length;

  const toggleIssue = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleAll = () => setSelected(
    selectedList.length === ISSUES.length ? new Set() : new Set(ISSUES.map(i => i.id))
  );

  const runJobs = () => {
    setRunning(true);
    const initial: JobResult[] = selectedList.map(issue => ({ issue, status: 'pending' }));
    setJobResults(initial);
    setStep(2);

    selectedList.forEach((issue, idx) => {
      const delay = idx * 220;
      setTimeout(() => {
        setJobResults(prev => prev.map(j => j.issue.id === issue.id ? { ...j, status: 'running' } : j));
      }, delay);
      setTimeout(() => {
        setJobResults(prev => prev.map(j =>
          j.issue.id === issue.id
            ? issue.willFail
              ? { ...j, status: 'failed', error: 'Insufficient warehouse privileges to apply statistical function' }
              : { ...j, status: 'success' }
            : j
        ));
        if (idx === selectedList.length - 1) setRunning(false);
      }, delay + 180);
    });
  };

  const isRunningOrPending = running || (step === 2 && jobResults.some(j => j.status === 'pending' || j.status === 'running'));
  const meta = stepMeta[step];

  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: c['background-base'],
      zIndex: 200,
      display: 'flex', flexDirection: 'column',
      fontFamily: ff.primary,
    }}>

      {/* ── Analyzing state ── */}
      {isAnalyzing ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: sp.D }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: `3px solid ${c['border-divider']}`,
            borderTopColor: c['background-brand'],
            animation: 'spin 0.8s linear infinite',
          }} />
          <div style={{ fontSize: fs.md, fontWeight: fw.medium, color: c['content-primary'] }}>
            Analyzing data to spot quality issues
          </div>
          <div style={{ fontSize: fs.sm, color: c['content-secondary'] }}>
            Scanning {ISSUES.length} columns across {new Set(ISSUES.map(i => i.table)).size} tables…
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <>
          {/* Top: context + title */}
          <div style={{ padding: `${sp.H}px ${sp.J}px ${sp.D}px`, flexShrink: 0 }}>
            <div style={{ fontSize: fs.xs, color: c['content-secondary'], marginBottom: sp.A }}>
              {meta.context}
            </div>
            <div style={{ fontSize: fs['2xl'], fontWeight: fw.semibold, color: c['content-primary'] }}>
              {meta.title}
            </div>
            {step === 2 && !isRunningOrPending && (
              <div style={{ fontSize: fs.sm, color: c['content-secondary'], marginTop: sp.B }}>
                {scheduledCount} of {selectedList.length} completed
              </div>
            )}
            {step === 3 && (
              <div style={{ fontSize: fs.sm, color: c['content-secondary'], marginTop: sp.B }}>
                {scheduledCount} operation{scheduledCount !== 1 ? 's' : ''} scheduled · runs on every cache refresh
              </div>
            )}
          </div>

          {/* Scrollable content */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: `0 ${sp.J}px` }}>
            {step === 1 && (
              <Step1
                issues={ISSUES}
                selected={selected}
                fixValues={fixValues}
                onToggle={toggleIssue}
                onToggleAll={toggleAll}
                onFixChange={(id, val) => setFixValues(prev => ({ ...prev, [id]: val }))}
              />
            )}
            {step === 2 && <Step2 jobResults={jobResults} fixValues={fixValues} running={running} />}
            {step === 3 && <Step3 jobResults={jobResults} />}
          </div>

          {/* Progress bar */}
          <div style={{ height: 3, backgroundColor: c['background-subtle'], flexShrink: 0 }}>
            <div style={{
              height: '100%',
              width: `${(step / TOTAL_STEPS) * 100}%`,
              backgroundColor: c['background-brand'],
              transition: 'width 0.3s ease',
            }} />
          </div>

          {/* Footer */}
          <div style={{ padding: `${sp.D}px ${sp.J}px`, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            {step !== 2 && (
              <button onClick={onClose} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: c['content-brand'], fontSize: fs.sm,
                fontFamily: ff.primary, padding: 0,
              }}>
                Cancel
              </button>
            )}
            <div style={{ flex: 1 }} />

            {step === 1 && (
              <button
                onClick={runJobs}
                disabled={selectedList.length === 0}
                style={{
                  ...pillBtn,
                  opacity: selectedList.length === 0 ? 0.45 : 1,
                  cursor: selectedList.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                Apply fixes
              </button>
            )}
            {step === 2 && (
              <button
                onClick={() => setStep(3)}
                disabled={isRunningOrPending}
                style={{
                  ...pillBtn,
                  opacity: isRunningOrPending ? 0.45 : 1,
                  cursor: isRunningOrPending ? 'not-allowed' : 'pointer',
                }}
              >
                Next
              </button>
            )}
            {step === 3 && (
              <button onClick={() => onDone()} style={pillBtn}>
                Done
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const pillBtn: React.CSSProperties = {
  padding: `${sp.B}px ${sp.F}px`,
  backgroundColor: c['background-brand'], color: '#fff',
  border: 'none', borderRadius: 20,
  fontSize: fs.sm, fontWeight: fw.medium,
  cursor: 'pointer', fontFamily: ff.primary,
};

export default PrepWizard;
