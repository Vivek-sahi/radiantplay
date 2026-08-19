import React, { useMemo, useRef, useState } from 'react';
import { Button } from '@components/Button';
import { Check, X, Ban, Trash, Pencil } from './icons';
import GradingChart from './GradingChart';
import type { SampleQuestion } from './data';
import type { GradingResult } from './gradingTypes';
import { c as tok } from '../../styles';

/**
 * Inline Spotter grading — two distinct steps:
 *  1. Questions: review the proposed sample questions, mark any Out of scope, add your own,
 *     then "Generate answers".
 *  2. Grade (focused): assess ONE question at a time — the question, its answer chart, and a
 *     single Looks right / Incorrect judgement (with an optional reason). Progress dots track
 *     the set; the last question's CTA submits. On submit the panel drafts fixes for the wrong
 *     answers.
 */
type Phase = 'questions' | 'generating' | 'answers';
const REASONS = ['Wrong metric', 'Wrong grouping', 'Wrong time period', 'Wrong chart type'];

const groupByTopic = (qs: SampleQuestion[]): [string, SampleQuestion[]][] => {
  const order: string[] = [];
  const by = new Map<string, SampleQuestion[]>();
  for (const q of qs) { const t = q.topic ?? 'other'; if (!by.has(t)) { by.set(t, []); order.push(t); } by.get(t)!.push(q); }
  return order.map((t) => [t, by.get(t)!]);
};

const InlineGrading: React.FC<{ questions: SampleQuestion[]; onDone: (r: GradingResult) => void; onEdit?: (question: SampleQuestion) => void }> = ({ questions, onDone, onEdit }) => {
  const [phase, setPhase] = useState<Phase>('questions');
  const [added, setAdded] = useState<SampleQuestion[]>([]);
  const [newQ, setNewQ] = useState('');
  const [oos, setOos] = useState<Set<string>>(new Set());
  const [verdicts, setVerdicts] = useState<Record<string, 'correct' | 'incorrect'>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  // Free-text detail, kept separate from the selected reason chip so the textarea doesn't
  // just repeat the chip the user already picked.
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  // Focused grader — index into the graded set (one assessed at a time).
  const [curIdx, setCurIdx] = useState(0);
  /**
   * The questions being graded, frozen when the grade step opens.
   *
   * Deliberately not `inScope`, which is derived from `oos` live: marking the current
   * question out of scope mid-grade would shrink that array under the index, silently
   * swapping the question on screen and — on the last one — leaving the panel blank.
   * Freezing keeps "Question 3 of 6" true for the whole pass; an out-of-scope question
   * stays in the run as a graded-and-excluded item rather than vanishing from it.
   */
  const [gradeSet, setGradeSet] = useState<SampleQuestion[]>([]);
  const genTimer = useRef<number | null>(null);

  const all = useMemo(() => [...questions, ...added], [questions, added]);
  const groups = useMemo(() => groupByTopic(all), [all]);
  const inScope = all.filter((q) => !oos.has(q.id));
  // Graded = in the frozen set and still in scope. Out-of-scope answers aren't wrong,
  // so they must not pull a fix into the next step.
  const graded = gradeSet.filter((q) => !oos.has(q.id));
  const incorrectCount = graded.filter((q) => verdicts[q.id] === 'incorrect').length;

  const toggleOos = (id: string) => setOos((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const setVerdict = (id: string, v: 'correct' | 'incorrect') => setVerdicts((m) => ({ ...m, [id]: v }));
  /**
   * Out of scope, from the grade step. Clears any verdict: "this question shouldn't be
   * asked of this model" and "Spotter answered it wrong" are different claims, and
   * holding both would send a fix for a question we've just excluded.
   */
  const markOos = (id: string) => {
    setVerdicts((m) => { const n = { ...m }; delete n[id]; return n; });
    toggleOos(id);
  };
  const setReason = (id: string, r: string) => setReasons((m) => ({ ...m, [id]: r }));
  const setNote = (id: string, r: string) => setNotes((m) => ({ ...m, [id]: r }));

  const addQuestion = () => {
    const name = newQ.trim(); if (!name) return;
    setAdded((a) => [...a, {
      id: `qx-${a.length + 1}`, name, description: 'Spotter’s answer to your question.', chartType: 'bar', topic: 'your questions',
      chart: { kind: 'bar', categories: ['Segment A', 'Segment B', 'Segment C'], series: [{ name: 'Result', data: [42, 31, 18] }] },
    }]);
    setNewQ('');
  };
  const removeAdded = (id: string) => { setAdded((a) => a.filter((q) => q.id !== id)); setOos((s) => { const n = new Set(s); n.delete(id); return n; }); };

  const generate = () => { setCurIdx(0); setGradeSet(inScope); setPhase('generating'); genTimer.current = window.setTimeout(() => setPhase('answers'), 1700); };

  const done = () => {
    const v: GradingResult['verdicts'] = {};
    for (const q of all) {
      if (oos.has(q.id)) v[q.id] = { state: 'oos' };
      else v[q.id] = { state: verdicts[q.id], reason: verdicts[q.id] === 'incorrect' ? [reasons[q.id], notes[q.id]].filter(Boolean).join(' — ') || undefined : undefined };
    }
    setSubmitted(true);
    onDone({ questions: all, verdicts: v });
  };

  // ── Questions step (unchanged) — review + curate the set ──
  const renderQuestion = (q: SampleQuestion) => {
    const isOos = oos.has(q.id);
    const isAdded = !!added.find((a) => a.id === q.id);
    return (
      <div className={`calx-ig-row${isOos ? ' s-oos' : ''}`} key={q.id}>
        <div className="calx-ig-rowhead">
          <span className="calx-ig-rowbody">
            <span className="calx-ig-qname">{q.name}</span>
            <span className="calx-ig-qdesc">{q.description}</span>
          </span>
          <span className="calx-ig-head-actions">
            {/* A user-added question is in scope by definition — no "Out of scope" toggle.
                Icon only: it repeats on every question in the list, and a labelled pill
                that many times competes with the questions themselves — which are what
                she's here to read. The label moves to the tooltip, and flips once the
                question is out of scope so the control says what the click will do. */}
            {!isAdded && (
              <button
                className={`calx-ig-iconbtn${isOos ? ' on' : ''}`}
                onClick={() => toggleOos(q.id)}
                title={isOos ? 'Bring back into scope' : 'Mark out of scope'}
                aria-label={isOos ? 'Bring back into scope' : 'Mark out of scope'}
                aria-pressed={isOos}
              >
                {isOos ? <Ban size={14} /> : <X size={14} />}
              </button>
            )}
            {isAdded && <button className="calx-ig-del" title="Remove" onClick={() => removeAdded(q.id)}><Trash size={14} /></button>}
          </span>
        </div>
      </div>
    );
  };

  // ── Grade step — focused, one question at a time ──
  if (phase === 'answers') {
    if (submitted) {
      return <div className="calx-ig-focus"><div className="calx-ig-graded"><Check size={14} strokeWidth={2.6} />Graded {graded.length} {graded.length === 1 ? 'question' : 'questions'}.</div></div>;
    }
    const q = gradeSet[curIdx];
    if (!q) return null;
    const v = verdicts[q.id];
    const isOosNow = oos.has(q.id);
    // Out of scope counts as answered — she has made a judgement, it just isn't a grade.
    const answered = Boolean(v) || isOosNow;
    const isLast = curIdx >= gradeSet.length - 1;
    const next = () => { if (!answered) return; if (isLast) done(); else setCurIdx((i) => Math.min(i + 1, gradeSet.length - 1)); };
    return (
      <div className="calx-ig-focus">
        <div className="calx-ig-progress">
          <span className="calx-ig-progress-label">Question {curIdx + 1} of {gradeSet.length}</span>
          <div className="calx-ig-dots">
            {gradeSet.map((iq, i) => {
              const iv = verdicts[iq.id];
              const cls = i === curIdx ? 'cur'
                : oos.has(iq.id) ? 'oos'
                : iv === 'correct' ? 'ok'
                : iv === 'incorrect' ? 'bad' : 'todo';
              return <span key={iq.id} className={`calx-ig-dot ${cls}`} />;
            })}
          </div>
        </div>

        <div className="calx-ig-focus-q">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="calx-ig-focus-name">{q.name}</div>
              {q.description && <div className="calx-ig-focus-desc">{q.description}</div>}
            </div>
            {onEdit && (
              <button
                onClick={() => onEdit(q)}
                style={{
                  flexShrink: 0,
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: `1px solid ${tok['border-subtle-hover']}`,
                  background: '#fff',
                  color: '#64748B',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 120ms',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#CBD5E1';
                  e.currentTarget.style.color = '#475569';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = tok['border-subtle-hover'];
                  e.currentTarget.style.color = '#64748B';
                }}
              >
                <Pencil size={12} />
                Edit
              </button>
            )}
          </div>
        </div>

        <div className="calx-ig-chartwrap"><GradingChart chart={q.chart} height={200} /></div>

        <div className="calx-ig-gq">Does this answer look correct?</div>
        <div className="calx-gm-pills">
          <button className={`calx-gm-pill${v === 'correct' ? ' on ok' : ''}`} onClick={() => setVerdict(q.id, 'correct')}><Check size={12} strokeWidth={2.6} />Looks right</button>
          <button className={`calx-gm-pill${v === 'incorrect' ? ' on bad' : ''}`} onClick={() => setVerdict(q.id, 'incorrect')}><X size={12} strokeWidth={2.4} />Incorrect</button>
          {/* Third judgement, not a third grade: some questions shouldn't be asked of this
              model at all, and calling those "incorrect" would put a fix on the list for a
              question nobody wants answered. Labelled here, unlike the icon-only toggle in
              the review list — this is a considered decision made once per answer, not a
              control repeating down a list. */}
          <button className={`calx-gm-pill${isOosNow ? ' on oos' : ''}`} onClick={() => markOos(q.id)} aria-pressed={isOosNow}><Ban size={12} />Out of scope</button>
        </div>
        {v === 'incorrect' && (
          <div className="calx-gm-reason">
            <div className="calx-gm-chips">
              {REASONS.map((c) => <button key={c} className={`calx-gm-chip${reasons[q.id] === c ? ' on' : ''}`} onClick={() => setReason(q.id, c)}>{c}</button>)}
            </div>
            <textarea className="calx-gm-reasonta" placeholder="Add more detail (optional)" value={notes[q.id] ?? ''} onChange={(e) => setNote(q.id, e.target.value)} />
          </div>
        )}

        <div className="calx-ig-focus-nav">
          {curIdx > 0 && <Button variant="tertiary" onClick={() => setCurIdx((i) => Math.max(0, i - 1))}>Back</Button>}
          <span className="calx-ig-focus-spacer" />
          <Button variant="primary" disabled={!answered} onClick={next}>
            {isLast ? (incorrectCount > 0 ? 'Suggest fixes' : 'Done') : 'Next question'}
          </Button>
        </div>
      </div>
    );
  }

  // ── Questions / generating steps ──
  return (
    <>
      {phase === 'questions' && (
        <>
          {groups.map(([topic, items]) => (
            <div className="calx-gcard-group" key={topic}>
              <div className="calx-gcard-grouphead">For {topic}</div>
              {items.map(renderQuestion)}
            </div>
          ))}
          <div className="calx-ig-addrow">
            <input className="calx-gm-addinput" placeholder="Add a question…" value={newQ}
              onChange={(e) => setNewQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addQuestion(); } }} />
            <Button variant="tertiary" icon="plus" iconPosition="leading" disabled={!newQ.trim()} onClick={addQuestion}>Add</Button>
          </div>
          <div className="calx-ig-foot">
            <Button variant="primary" disabled={inScope.length === 0} onClick={generate}>Generate answers</Button>
          </div>
        </>
      )}
      {phase === 'generating' && (
        <div className="calx-ig-generating"><span className="calx-ig-gen-dot" /><span className="calx-ig-gen-dot" /><span className="calx-ig-gen-dot" />Generating answers…</div>
      )}
    </>
  );
};

export default InlineGrading;
