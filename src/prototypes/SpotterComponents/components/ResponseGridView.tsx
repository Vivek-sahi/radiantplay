import React, { useRef, useState } from 'react';
import { spacing } from '@tokens/spacing';
import { fontSize, fontWeight, lineHeight } from '@tokens/typography';
import { Avatar } from '@components/Avatar';
import { Button } from '@components/Button';
import { Toggle } from '@components/Toggle';
import { UserMessage } from './UserMessage';
import { Reasoning, ReasoningItem } from './Reasoning';
import footerStyles from './ResponseGridView.module.css';
import agentAvatar from '../assets/image-1783516317669.png';

// ── Layout constants ───────────────────────────────────────────────────────────
//
// This view simulates the full "page" so all measurements are visible together:
//
//   ┌─ page simulation (resizable) ────────────────────────────────────────┐
//   │ 24 │          centered content (max 800px)               │ 24 │ ◀─ drag
//   │    │  ┌─ response (max 800) ──────────────────────────┐  │    │
//   │    │  │ 16 │   text column (max 768px)           │ 16 │  │    │
//   │    │  └──────────────────────────────────────────────┘  │    │
//   └──────────────────────────────────────────────────────────────────────┘
//
//   • The drag handle is at the right outer edge of the page (right of the 24px band)
//   • Dragging the page sim narrower simulates browser window resize
//   • Content (chat + response) stays centered; once the 800px column fills the
//     available area it starts shrinking with the page

const PAGE_PAD  = spacing.F;  // 24 — page gutter on each side
const INNER_PAD = spacing.D;  // 16 — inner padding on each side of the response
const CONTENT_MAX = 800;       // max content column width
const PAGE_MIN = 400;          // 320 text + 32 inner pads + 48 page bands

// Color coding
const C_PAGE  = {
  band: 'var(--rd-sys-color-background-accent-purple-subtle)',
  ink:  'var(--rd-sys-color-background-accent-purple-bold)',
};
const C_INNER = {
  band: 'var(--rd-sys-color-background-information)',
  ink:  'var(--rd-sys-color-content-information)',
};
const C_TEXT = { line: 'var(--rd-sys-color-content-success)' };

// Demo reasoning trail shown under the agent photo — content doesn't matter here,
// this view only demonstrates the layout (avatar → reasoning → response, 12px gaps).
const AGENT_REASONING_ITEMS: ReasoningItem[] = [
  {
    kind: 'text',
    id: 'agent-r1',
    summaryHeader: 'Reviewed revenue by region',
    text: 'Pulled monthly revenue for the last 12 months and grouped it by region to compare growth.',
  },
];

// Two demo turns — the "Stack turns" toggle repeats the response block so
// multi-turn spacing can be checked (gap above the 2nd user message, etc.).
interface TurnSection {
  heading?: string;
  body: string;
}
interface Turn {
  message: string;
  responseHeading: string;
  sections: TurnSection[];
}
const TURNS: Turn[] = [
  {
    message: 'Show me monthly revenue broken down by region for the last 12 months',
    responseHeading: 'Revenue overview',
    sections: [
      {
        body: 'Revenue reached $48.2M over the last twelve months, up 14% year over year. Growth was steady through the first three quarters and accelerated in Q4 as the enterprise segment closed several large renewals.',
      },
      {
        heading: "What's driving it",
        body: 'The North America region contributed 58% of total revenue and grew fastest at 21%. EMEA held flat against a stronger prior year, while APAC rebounded in the second half after a slow start. Expansion revenue from existing accounts outpaced new logo revenue for the first time.',
      },
      {
        heading: 'Where to look next',
        body: 'EMEA is the clearest opportunity — pipeline coverage there is healthy but conversion lagged. A focused review of the mid-market motion in that region would likely recover the gap before year end.',
      },
    ],
  },
  {
    message: 'How does that compare to the same period last year?',
    responseHeading: 'Year-over-year comparison',
    sections: [
      {
        body: 'Last year revenue over the same twelve months was $42.3M, so this year is up $5.9M — a 14% increase. North America drove most of the gain, while EMEA is the only region that grew slower than it did a year ago.',
      },
    ],
  },
];

// ── Component ──────────────────────────────────────────────────────────────────

export const ResponseGridView: React.FC = () => {
  const [pageWidth, setPageWidth] = useState<number | null>(null); // null = 100%
  const [showGrid, setShowGrid] = useState(true); // measurement bands + text-column outline
  const [agentPhoto, setAgentPhoto] = useState(false); // not the Spotter default — embedded/custom-analyst only
  const [showReasoning, setShowReasoning] = useState(false);
  const [stackTurns, setStackTurns] = useState(false);
  const [expandedTurns, setExpandedTurns] = useState<Set<number>>(new Set());
  const toggleTurnExpanded = (i: number) =>
    setExpandedTurns((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  const pageRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const dragStartW = useRef(0);

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    dragStartX.current = e.clientX;
    dragStartW.current = pageRef.current?.offsetWidth ?? 848;

    const onMove = (ev: MouseEvent) => {
      const next = dragStartW.current + (ev.clientX - dragStartX.current);
      setPageWidth(Math.max(PAGE_MIN, next));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const agentAvatarEl = (
    <Avatar name="Acme analyst" size="s" src={agentAvatar} className={footerStyles.avatarNoBg} />
  );

  return (
    <div style={s.root}>
      {/* Legend */}
      <div style={s.legend}>
        <Toggle
          label="Grid overlay"
          checked={showGrid}
          onChange={setShowGrid}
          labelPosition="right"
        />
        <span style={s.legendDivider} />
        <div style={s.legendGroup}>
          <span style={{ ...s.swatch, backgroundColor: C_PAGE.band }} />
          <span style={s.legendText}>Page padding · 24px</span>
        </div>
        <div style={s.legendGroup}>
          <span style={{ ...s.swatch, backgroundColor: C_INNER.band }} />
          <span style={s.legendText}>Inner padding · 16px</span>
        </div>
        <div style={s.legendGroup}>
          <span style={{ ...s.swatchLine, borderColor: C_TEXT.line }} />
          <span style={s.legendText}>Text column · max 768px</span>
        </div>
        <span style={s.legendDivider} />
        <span style={s.legendNote}>Changes: no avatar · narrower response width</span>
        <span style={s.legendDivider} />
        <Toggle
          label="Agent photo"
          checked={agentPhoto}
          onChange={setAgentPhoto}
          labelPosition="right"
        />
        <Toggle
          label="Show reasoning"
          checked={showReasoning}
          onChange={setShowReasoning}
          labelPosition="right"
        />
        <Toggle
          label="Stack turns"
          checked={stackTurns}
          onChange={setStackTurns}
          labelPosition="right"
        />
        {pageWidth !== null && (
          <div style={s.widthBadge}>
            <span style={s.widthLabel}>{pageWidth}px</span>
            <button style={s.resetBtn} onClick={() => setPageWidth(null)}>Reset</button>
          </div>
        )}
      </div>

      {/* Canvas — scrollable, centers the page sim */}
      <div style={s.canvas}>
        {/* Page simulation — bands + content form one resizable unit */}
        <div
          ref={pageRef}
          style={{
            ...s.pageSim,
            width: pageWidth !== null ? pageWidth : '100%',
          }}
        >
          {/* Left 24px page band */}
          <div style={{ ...s.pageBand, backgroundColor: showGrid ? C_PAGE.band : 'transparent' }}>
            {showGrid && <span style={{ ...s.bandLabel, color: C_PAGE.ink }}>24</span>}
          </div>

          {/* Content column — centered, max 800px */}
          <div style={s.pageContent}>
            {(stackTurns ? TURNS : TURNS.slice(0, 1)).map((turn, i) => (
              <div key={i}>
                <UserMessage message={turn.message} state="default" />

                {/* Response — centered row with inner bands */}
                <div style={s.responseOuter}>
                  {/* Left 16px inner band */}
                  <div style={{ ...s.innerBand, backgroundColor: showGrid ? C_INNER.band : 'transparent' }}>
                    {showGrid && <span style={{ ...s.bandLabel, color: C_INNER.ink }}>16</span>}
                  </div>

                  {/* Text column — max 768px */}
                  <div style={{ ...s.textCol, outline: showGrid ? s.textCol.outline : 'none' }}>
                    {/* Reasoning and agent photo are independent. When reasoning is
                        shown, the photo (if on) sits inside the "Show work" trigger;
                        when reasoning is off, the photo stands alone at the top. */}
                    {showReasoning && (
                      <div style={s.agentReasoning}>
                        <Reasoning
                          items={AGENT_REASONING_ITEMS}
                          visibleCount={AGENT_REASONING_ITEMS.length}
                          status="done"
                          expanded={expandedTurns.has(i)}
                          onToggleExpanded={() => toggleTurnExpanded(i)}
                          triggerLeading={
                            agentPhoto ? <span style={s.triggerAvatar}>{agentAvatarEl}</span> : undefined
                          }
                        />
                      </div>
                    )}
                    {agentPhoto && !showReasoning && (
                      <div style={s.standaloneAvatar}>{agentAvatarEl}</div>
                    )}
                    <h2 style={s.h2}>{turn.responseHeading}</h2>
                    {turn.sections.map((sec, j) => (
                      <React.Fragment key={j}>
                        {sec.heading && <h3 style={s.h3}>{sec.heading}</h3>}
                        <p style={s.body}>{sec.body}</p>
                      </React.Fragment>
                    ))}

                    {/* Response footer — thumbs up/down, copy, double-check. 20px below the
                        last response text; buttons pulled -4px left for optical alignment. */}
                    <div style={s.responseFooter}>
                      <Button variant="tertiary" size="small" iconOnly icon="thumb-up" title="Good response" className={footerStyles.footerIconBtn}>
                        Good response
                      </Button>
                      <Button variant="tertiary" size="small" iconOnly icon="thumb-down" title="Bad response" className={footerStyles.footerIconBtn}>
                        Bad response
                      </Button>
                      <Button variant="tertiary" size="small" iconOnly icon="copy" title="Copy" className={footerStyles.footerIconBtn}>
                        Copy
                      </Button>
                      <Button variant="tertiary" size="small" iconOnly icon="double-check" title="Verify" className={footerStyles.footerIconBtn}>
                        Verify
                      </Button>
                    </div>
                  </div>

                  {/* Right 16px inner band */}
                  <div style={{ ...s.innerBand, backgroundColor: showGrid ? C_INNER.band : 'transparent' }}>
                    {showGrid && <span style={{ ...s.bandLabel, color: C_INNER.ink }}>16</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right 24px page band */}
          <div style={{ ...s.pageBand, backgroundColor: showGrid ? C_PAGE.band : 'transparent' }}>
            {showGrid && <span style={{ ...s.bandLabel, color: C_PAGE.ink }}>24</span>}
          </div>

          {/* Drag handle — at the right outer edge of the page sim */}
          <div style={s.dragHandle} onMouseDown={handleDragStart} title="Drag to resize">
            <div style={s.dragHandleBar} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  root: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minHeight: 0,
  },

  // Legend bar
  legend: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.D,
    flexWrap: 'wrap' as const,
    padding: `${spacing.B}px ${spacing.D}px`,
    borderBottom: '1px solid var(--rd-sys-color-border-subtle)',
    flexShrink: 0,
  },
  legendGroup: { display: 'flex', alignItems: 'center', gap: spacing.B },
  swatch: { width: 14, height: 14, borderRadius: 3, display: 'inline-block' },
  swatchLine: {
    width: 14,
    height: 14,
    borderRadius: 3,
    border: '1.5px dashed',
    display: 'inline-block',
  },
  legendText: { fontSize: fontSize.xs, color: 'var(--rd-sys-color-content-secondary)' },
  legendDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'var(--rd-sys-color-border-subtle)',
    display: 'inline-block',
  },
  legendNote: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: 'var(--rd-sys-color-content-brand)',
  },
  widthBadge: { display: 'flex', alignItems: 'center', gap: spacing.B, marginLeft: 'auto' },
  widthLabel: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    color: 'var(--rd-sys-color-content-secondary)',
    fontVariantNumeric: 'tabular-nums',
    minWidth: 36,
    textAlign: 'right' as const,
  },
  resetBtn: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    color: 'var(--rd-sys-color-content-brand)',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: `1px ${spacing.B}px`,
  },

  // Scrollable canvas — centers the page sim
  canvas: {
    flex: 1,
    overflow: 'auto',
    display: 'flex',
    justifyContent: 'center',
    padding: `${spacing.J}px 0`,
  },

  // Page simulation — the entire "page" including bands; drag handle at right outer edge
  pageSim: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'stretch',
    minWidth: PAGE_MIN,
    maxWidth: '100%',
    alignSelf: 'flex-start',
    boxSizing: 'border-box' as const,
  },

  // 24px page band — left or right edge of the page sim
  pageBand: {
    width: PAGE_PAD,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: spacing.B,
  },
  bandLabel: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '0.02em',
  },

  // Content column between the bands — centered, max 800px
  pageContent: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 0,
    padding: `${spacing.J}px 0`,
  },

  // Response row — aligns with UserMessage at max 800px, centered
  responseOuter: {
    display: 'flex',
    alignItems: 'stretch',
    width: '100%',
    maxWidth: CONTENT_MAX,
    margin: '0 auto',
    borderRadius: 12,
    overflow: 'hidden',
  },

  // 16px inner band — left or right side of the response
  innerBand: {
    width: INNER_PAD,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: spacing.B,
  },

  // Text column — capped at 768px
  textCol: {
    flex: 1,
    minWidth: 320,
    maxWidth: CONTENT_MAX - INNER_PAD * 2, // 768
    boxSizing: 'border-box' as const,
    outline: `1.5px dashed ${C_TEXT.line}`,
    outlineOffset: -1,
    padding: `0 0 ${spacing.J}px`, // 48 — includes the footer's own space
  },

  agentReasoning: {
    marginBottom: spacing.C,
    marginLeft: -spacing.D, // cancel Reasoning's own 16px left padding — already inset by the 16px inner band
  },

  // Agent photo inside the "Show work" trigger — 24px circle, 2px optical indent
  // left, +6px so the gap to the label is 10px (trigger's built-in 4px gap + 6px).
  triggerAvatar: {
    display: 'flex',
    marginLeft: -2,
    marginRight: 6,
  },
  // Agent photo when reasoning is off — stands alone at the top of the response.
  // -2px optical indent to match the in-trigger placement; 12px gap below to
  // match the reasoning-on gap (Reasoning's collapsed margin-bottom).
  standaloneAvatar: {
    display: 'flex',
    marginLeft: -2,
    marginBottom: spacing.C,
  },

  // Response typography
  h2: {
    margin: `0 0 ${spacing.B}px`,
    fontSize: fontSize.xl,
    lineHeight: `${lineHeight.xl}px`,
    fontWeight: fontWeight.semibold,
    color: 'var(--rd-sys-color-content-primary)',
  },
  h3: {
    margin: `${spacing.E}px 0 ${spacing.A}px`,
    fontSize: fontSize.lg,
    lineHeight: `${lineHeight.lg}px`,
    fontWeight: fontWeight.semibold,
    color: 'var(--rd-sys-color-content-primary)',
  },
  body: {
    margin: 0,
    fontSize: fontSize.md,
    lineHeight: `${lineHeight.lg}px`,
    fontWeight: fontWeight.regular,
    color: 'var(--rd-sys-color-content-primary)',
  },

  // Response footer — thumbs up/down, copy, double-check. 20px below the last
  // response text; -4px left margin optically aligns the icons with the text.
  responseFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.B, // 8
    marginTop: spacing.E, // 20
    marginLeft: -spacing.A, // -4
  },

  // Drag handle — right outer edge of the page sim
  dragHandle: {
    position: 'absolute' as const,
    top: 0,
    right: -4,
    width: 8,
    height: '100%',
    cursor: 'ew-resize',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  dragHandleBar: {
    width: 3,
    height: 28,
    borderRadius: 2,
    backgroundColor: 'var(--rd-sys-color-border-default)',
    pointerEvents: 'none' as const,
  },
};

export default ResponseGridView;
