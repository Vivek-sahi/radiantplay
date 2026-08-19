import React, { useMemo, useState } from 'react';
import { Button } from '@components/Button';
import { Checkbox } from '@components/Checkbox';
import { Pencil, Info } from './icons';
import type { DiffField } from './data';

/**
 * The docked fixes list for a calibration step, shown in the SpotterModel prompt-bar slot —
 * mirrors the clarifying-questions dock. Grouping is supplied by the parent (impact tiers
 * for physical/semantic; the source question for Spotter grading). Each row is selectable;
 * hover reveals refine + info actions; the info action expands an INLINE detail panel
 * (before→after diff + impact) beneath the row. The pencil swaps the whole list for a refine
 * prompt, which on send returns to the list and shimmers the edited fix while it "updates".
 *
 * POC port note: the source's info action drove a canvas overlay (`onInfo` → highlight a
 * node on the DME canvas). This flow is agent-panel-only, so the same action instead toggles
 * the inline detail block below — no canvas dependency. The optional detail fields on FixItem
 * carry what that block renders.
 */
export interface FixItem {
  id: string;
  title: string;       // the value-driven problem (row title)
  desc?: string;       // the recommendation / fix (row description)
  // Optional detail — rendered inline when the row's info action is toggled (agent-only).
  where?: string;
  tag?: { label: string; tone: 'add' | 'edit' | 'remove' };
  diff?: DiffField[];
  impact?: string;
  suggestion?: string;
}
export interface FixGroup { key: string; label: string; items: FixItem[]; }

interface Props {
  stepLabel: string;                       // used in the refine header ("Refining … fix")
  groups: FixGroup[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onApply: () => void;
  onSkip: () => void;
  onInfo: (id: string) => void;
  highlightedId: string | null;
  onRefine: (id: string, prompt: string) => void;
  shimmerId: string | null;
}

const CalFixesDock: React.FC<Props> = ({
  stepLabel, groups, selected, onToggle, onApply, onSkip, onInfo, highlightedId, onRefine, shimmerId,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [refineId, setRefineId] = useState<string | null>(null);
  const [refineText, setRefineText] = useState('');

  const byId = useMemo(() => {
    const m = new Map<string, FixItem>();
    groups.forEach((g) => g.items.forEach((it) => m.set(it.id, it)));
    return m;
  }, [groups]);

  const allItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const total = allItems.length;
  const selCount = allItems.filter((it) => selected.has(it.id)).length;
  const flat = groups.length <= 1;

  const sendRefine = () => {
    if (!refineId || !refineText.trim()) return;
    onRefine(refineId, refineText.trim());
    setRefineId(null);
    setRefineText('');
  };

  // ── Refine sub-mode — the usual prompt bar in a "refining" variant ──
  if (refineId) {
    const title = byId.get(refineId)?.title ?? '';
    return (
      <div className="calfx-refine">
        <Button variant="tertiary" icon="chevron-left" iconPosition="leading" className="calfx-refine-return" onClick={() => { setRefineId(null); setRefineText(''); }}>
          Return to fixes
        </Button>
        <div className="calfx-refine-bar">
          <div className="calfx-refine-head">
            <div className="calfx-refine-label">Refining {stepLabel} fix</div>
            <div className="calfx-refine-fixname" title={title}>{title}</div>
          </div>
          <div className="calfx-refine-fulldiv" />
          <div className="calfx-refine-body">
            <textarea
              className="agent-textarea calfx-refine-ta"
              placeholder="What needs to change?"
              value={refineText}
              autoFocus
              onChange={(e) => setRefineText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendRefine(); } }}
            />
            <div className="prompt-bar-actions">
              <button className="send-btn" onClick={sendRefine} aria-label="Send">
                <img src="/spotter-assets/Primary buttton/Primary buttton/arrow-up-m.svg" width="16" height="16" alt="send" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderRow = (it: FixItem) => {
    const on = selected.has(it.id);
    const hovered = hoveredId === it.id;
    const highlighted = highlightedId === it.id;
    const shimmering = shimmerId === it.id;
    const hasDetail = !!(it.diff?.length || it.impact || it.suggestion || it.where);
    return (
      <React.Fragment key={it.id}>
      <div
        className={`calfx-row${highlighted && !shimmering ? ' is-highlighted' : ''}${hovered && !shimmering ? ' is-hover' : ''}${shimmering ? ' is-shimmer' : ''}`}
        onMouseEnter={() => setHoveredId(it.id)}
        onMouseLeave={() => setHoveredId(null)}
        onClick={() => onToggle(it.id)}
      >
        <span className="calfx-cb" onClick={(e) => e.stopPropagation()}>
          <Checkbox checked={on} showLabel={false} onChange={() => onToggle(it.id)} />
        </span>
        <span className="calfx-main">
          <span className="calfx-title" title={it.title}>{it.title}</span>
          {it.desc && <span className="calfx-desc" title={it.desc}>{it.desc}</span>}
        </span>
        {(hovered || highlighted) && !shimmering && (
          <span className={`calfx-actions${highlighted ? ' on-hl' : ''}`} onClick={(e) => e.stopPropagation()}>
            {hovered && (
              <button className="calfx-iconbtn" title="Refine with SpotterModel" onClick={() => { setRefineId(it.id); setRefineText(''); }}>
                <Pencil size={14} />
              </button>
            )}
            {hasDetail && (
              <button className={`calfx-iconbtn${highlighted ? ' active' : ''}`} title={highlighted ? 'Hide details' : 'Show details'} onClick={() => onInfo(it.id)}>
                <Info size={15} />
              </button>
            )}
          </span>
        )}
        {shimmering && <span className="calfx-shimmer" aria-hidden />}
      </div>
      {highlighted && hasDetail && !shimmering && (
        <div className="calfx-detail" onClick={(e) => e.stopPropagation()}>
          {(it.where || it.tag) && (
            <div className="calfx-detail-head">
              {it.tag && <span className={`calfx-detail-tag tone-${it.tag.tone}`}>{it.tag.label}</span>}
              {it.where && <span className="calfx-detail-where">{it.where}</span>}
            </div>
          )}
          {it.diff?.map((d, i) => (
            <div className={`calfx-diff${d.code ? ' is-code' : ''}`} key={i}>
              <div className="calfx-diff-field">{d.field}</div>
              <div className="calfx-diff-row">
                <span className="calfx-diff-before">{d.before}</span>
                <span className="calfx-diff-arrow">→</span>
                <span className="calfx-diff-after">{d.after}</span>
              </div>
            </div>
          ))}
          {it.suggestion && !it.diff?.length && <div className="calfx-detail-sugg">{it.suggestion}</div>}
          {it.impact && <div className="calfx-detail-impact">{it.impact}</div>}
        </div>
      )}
      </React.Fragment>
    );
  };

  return (
    <div className="calfx-card">
      <div className="calfx-list">
        {groups.map((g) => {
          const sel = g.items.filter((it) => selected.has(it.id)).length;
          return (
            <div className="calfx-group" key={g.key}>
              {!flat && (
                <div className="calfx-group-head">
                  <span className="calfx-group-label">{g.label} ({sel}/{g.items.length})</span>
                </div>
              )}
              {g.items.map(renderRow)}
            </div>
          );
        })}
      </div>
      <div className="calfx-action">
        <span className="calfx-count">{selCount}/{total} selected</span>
        <div className="calfx-action-btns">
          <Button variant="tertiary" onClick={onSkip}>Skip</Button>
          <Button variant="primary" disabled={selCount === 0} onClick={onApply}>Fix selected</Button>
        </div>
      </div>
    </div>
  );
};

export default CalFixesDock;
