import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { Icon } from '@components/icons';
import type { IconName } from '@components/icons';
import { ToolIcon, ToolIconName } from './ToolIcons';
import slackLogo from '../assets/slack.png';
import styles from './Reasoning.module.css';

// ── Data model ───────────────────────────────────────────────────────────────
//
// A flat timeline of two item kinds (per Figma 309-17376):
//   • text — read-only NL output from the agent (small dot marker)
//   • tool — a tool call: icon/logo + title + chevron, expandable to Input/Output code
// MCP tool calls use `logo` (an image src / placeholder) instead of a Radiant `icon`.

export interface CodeExecution {
  id: string;
  summaryHeader: string; // LLM-generated header for this nested block (done state)
  loadingHeader?: string; // present-tense header shown (shimmering) while this sub-step runs
  loadMs?: number; // how long this sub-step stays in its loading state (play machine)
  input?: string; // code input — omit when the block is a chart
  output?: string;
  chart?: ChartViz; // when present, the nested block opens the chart card instead of code
}

// A query token chip shown above the chart (Spotter's parsed query phrases).
export interface ChartToken {
  kind: 'measure' | 'filter' | 'keyword' | 'date';
  label: string;
}

// Visualization output (the "Visualizing data" tool). Input is the NL question;
// Output is a chart (or a table view of the same series), not code.
export interface ChartViz {
  question: string; // Input — the natural-language question
  tokens?: ChartToken[]; // query phrases shown above the chart
  series: { label: string; value: number }[]; // drives both the chart and table
}

// Labels for a nestable tool (code execution, answer generation). While only the
// first sub-step runs the row shows `singular`; once it's a nest the title is a
// count: `${runningVerb} N ${unit}` (running) / `${doneVerb} N ${unit}` (done).
export interface NestLabels {
  singular: string; // e.g. "Running a command" / "Visualizing data"
  runningVerb: string; // e.g. "Running" / "Creating"
  doneVerb: string; // e.g. "Ran" / "Created"
  unit: string; // plural unit, e.g. "commands" / "visualizations"
}

export type ReasoningItem =
  | { kind: 'text'; id: string; text: string; summaryHeader?: string }
  | {
      kind: 'tool';
      id: string;
      title: string; // present tense, shown while loading ("Fetching…")
      doneTitle?: string; // past tense, shown once loaded ("Fetched…")
      toolIcon?: ToolIconName; // custom tool-execution glyph (fetch/answer/code)
      icon?: IconName; // Radiant icon fallback
      logo?: string; // MCP logo image (e.g. Slack)
      connector?: string; // connector display name (e.g. "Slack") — drives the header
      group?: string; // tools sharing a group id run in parallel = one step
      loadMs?: number; // demo only: how long this tool holds the loading state
      // MCP permission gate — when present, the expanded body shows an approval
      // prompt instead of the code.
      permission?: { action: string; description?: string };
      // Error / permission-denied — title turns red; the Output shows this message
      // in a red block instead of the normal output.
      error?: string;
      input?: string;
      output?: string;
      codeExecutions?: CodeExecution[]; // nested code-execution blocks (double accordion)
      // Nesting (code execution or answer generation): the row starts as a single
      // non-clickable label (nest.singular) and only becomes a clickable nest once a
      // 2nd sub-step begins, at which point the title becomes a count built from
      // nest.runningVerb/doneVerb + nest.unit (e.g. "Running 2 commands",
      // "Created 4 visualizations"). Sub-steps use the same logic regardless.
      nest?: NestLabels;
      chart?: ChartViz; // visualization output — renders a chart instead of code
    };

// A single tool call (the `tool` variant of ReasoningItem).
export type ToolCall = Extract<ReasoningItem, { kind: 'tool' }>;

export interface ReasoningProps {
  items: ReasoningItem[];
  /** How many items are revealed — drives streaming + the collapsed ticker. */
  visibleCount: number;
  status: 'running' | 'done';
  expanded: boolean;
  onToggleExpanded: () => void;
  /** Tool ids that have finished loading. Tools not in the set render as loading;
   *  omit entirely to treat every tool as loaded. */
  loadedToolIds?: Set<string>;
  /** Optional element rendered inside the trigger, before the label (e.g. an
   *  agent photo). Uses the trigger's own 4px gap + centre alignment. */
  triggerLeading?: React.ReactNode;
}

// ── Semi-collapsed model ───────────────────────────────────────────────────────
//
// While the agent works, the collapsed reasoning shows a shimmer header + only the
// LATEST ongoing step (per Figma 309-17543). The step is one of:
//   • text  — a block of NL output; header = its LLM summary (or "Working" if none)
//   • tools — one or more tool calls running in parallel; header derived from their mix
// Both views use the SAME tool model (ToolCall) — no separate semi-collapsed type.

export type LatestStep =
  | { kind: 'text'; summaryHeader?: string; text: string }
  | { kind: 'tools'; tools: ToolCall[] };

// A step's items as a flat ReasoningItem[] (used to derive the header).
function stepItemsOf(step: LatestStep): ReasoningItem[] {
  return step.kind === 'text'
    ? [{ kind: 'text', id: '_', text: step.text, summaryHeader: step.summaryHeader }]
    : step.tools;
}

// The latest "step" = the trailing run of revealed items that belong together
// (parallel tools share a `group`; everything else is a single-item step).
function latestStepItems(revealed: ReasoningItem[]): ReasoningItem[] {
  if (revealed.length === 0) return [];
  const last = revealed[revealed.length - 1];
  const group = last.kind === 'tool' ? last.group : undefined;
  if (!group) return [last];
  const out: ReasoningItem[] = [];
  for (let i = revealed.length - 1; i >= 0; i--) {
    const it = revealed[i];
    if (it.kind === 'tool' && it.group === group) out.unshift(it);
    else break;
  }
  return out;
}

// The shimmer header for a step: LLM summary for text; "Calling tool" / "Using
// {connector}" / "Calling tool and using {connector}" for tool calls.
export function toolStepLabel(items: ReasoningItem[]): string {
  if (items.length === 0) return 'Working';
  if (items.length === 1 && items[0].kind === 'text') {
    return items[0].summaryHeader ?? 'Working';
  }
  const tools = items.filter((i): i is ToolCall => i.kind === 'tool');
  const connectors = Array.from(
    new Set(tools.map((t) => t.connector).filter((c): c is string => !!c)),
  );
  const hasInternal = tools.some((t) => !t.connector);
  if (connectors.length === 0) return 'Calling tool';
  const using = `using ${connectors.join(' and ')}`;
  if (!hasInternal) return using.charAt(0).toUpperCase() + using.slice(1); // "Using Slack"
  return `Calling tool and ${using}`; // "Calling tool and using Slack"
}

// ── Syntax highlighting ───────────────────────────────────────────────────────
// Lightweight tokenizer for JS-style tool call pseudocode.

type TokenType = 'string' | 'number' | 'keyword' | 'key' | 'fn' | 'plain';
type Token = { type: TokenType; text: string };

const KEYWORDS = new Set([
  'import', 'from', 'export', 'default', 'function', 'const', 'let', 'var',
  'return', 'new', 'await', 'async', 'if', 'else', 'true', 'false', 'null',
]);

function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < code.length) {
    const rest = code.slice(i);
    // String literal
    const strM = rest.match(/^("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/);
    if (strM) { tokens.push({ type: 'string', text: strM[1] }); i += strM[1].length; continue; }
    // Number
    const numM = rest.match(/^\b\d+(?:\.\d+)?\b/);
    if (numM) { tokens.push({ type: 'number', text: numM[0] }); i += numM[0].length; continue; }
    // Identifier — classify by the word and what follows
    const idM = rest.match(/^[a-zA-Z_$][\w$.]*/);
    if (idM) {
      const word = idM[0];
      const after = code.slice(i + word.length).trimStart();
      let type: TokenType;
      if (KEYWORDS.has(word)) type = 'keyword';
      else if (after.startsWith(':')) type = 'key';
      else if (after.startsWith('(') || /^[A-Z]/.test(word)) type = 'fn';
      else type = 'plain';
      tokens.push({ type, text: word });
      i += word.length;
      continue;
    }
    tokens.push({ type: 'plain', text: code[i] });
    i++;
  }
  return tokens;
}

const SYN_CLASS: Partial<Record<TokenType, string>> = {
  string: styles.synString,
  number: styles.synNumber,
  keyword: styles.synKeyword,
  key: styles.synKey,
  fn: styles.synFn,
};

const CodeHighlight: React.FC<{ code: string }> = ({ code }) => (
  <>
    {tokenize(code).map((tok, idx) => {
      const cls = SYN_CLASS[tok.type];
      return cls ? <span key={idx} className={cls}>{tok.text}</span> : tok.text;
    })}
  </>
);

// ── Motion (keep in sync with Reasoning.module.css) ───────────────────────────
const MASK_MS = 420; // mask height + block translate (expand / collapse / ticker)
const MASK_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const SLIDE_MS = 340; // tool-card open/close — must exceed the CSS grid-rows 320ms

// ── Responsive padding (the grid) ─────────────────────────────────────────────
// The block lives in the same 800px content column as the user message and the
// response. The LEFT padding is a constant 16px; the RIGHT side carries up to 48px
// of EXTRA padding at wide widths so the 14px lines stay short and readable.
//
// As the column narrows, that extra collapses to 0 FIRST — the right padding hits
// 16px while the content is still at its 720px max — and only THEN does the content
// shrink together with the column, down to the 320px grid floor (so the whole block
// collapses to 352px incl. its 16+16 padding, matching the user message / response).
const GRID_MAX = 800; // max content column width
const PAD_BASE = 16; // constant left padding + base right padding
const PAD_EXTRA_MAX = 48; // extra right padding at full width

// Right padding for a block of outer width w. The extra rides on the slack above
// (GRID_MAX − PAD_EXTRA_MAX) = 752px, so it's the first thing to give as w shrinks.
function rightPadFor(w: number): number {
  const extra = Math.max(0, Math.min(PAD_EXTRA_MAX, w - (GRID_MAX - PAD_EXTRA_MAX)));
  return PAD_BASE + extra;
}

// Measures the block's own width and returns the responsive right padding.
function useReasoningPadding() {
  const ref = useRef<HTMLDivElement>(null);
  const [padRight, setPadRight] = useState(PAD_BASE + PAD_EXTRA_MAX);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    // offsetWidth is the outer (border-box) width set by the column — it doesn't
    // change when we adjust the padding, so there's no measure→set feedback loop.
    const measure = () => setPadRight(rightPadFor(el.offsetWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, padRight };
}

// ── Masked-block animation ────────────────────────────────────────────────────
// Drives ONE motion for collapse/expand AND the step-to-step ticker: measure the
// latest step's offset, then animate the mask height + block translateY together.
// Returns the ref to attach to the slide and the inline styles for mask + slide.
interface MaskInputs {
  expanded: boolean;
  running: boolean;
  status: ReasoningProps['status'];
  visibleCount: number;
  loading: boolean;
  stepCount: number;
  /** Changes when the latest step's content grows (e.g. text streaming a line). */
  contentKey: number;
}
function useCollapsibleMask({ expanded, running, status, visibleCount, loading, stepCount, contentKey }: MaskInputs) {
  const slideRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const firstDone = useRef(false);
  const rafRef = useRef<number | undefined>(undefined);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const animatingRef = useRef(false); // gates the ResizeObserver during the main animation
  const tfRafRef = useRef<number | undefined>(undefined);
  const prevExpandedRef = useRef(expanded);
  const prevFullRef = useRef<number | null>(null);
  // The mask is a BOTTOM-ANCHORED clip (flex-end): the content's bottom is always
  // glued to the mask bottom, so the last row / "Done" is pinned there at every
  // height — by construction, never clipped. EXPAND / COLLAPSE animates ONE property:
  // height. No transform → nothing can desync.
  const [view, setView] = useState<{ h: number | 'auto'; anim: boolean }>({ h: 0, anim: false });
  // Ticker (collapsed-running A→B): the slide starts shifted DOWN by the height the
  // new step added — so the OUTGOING step sits at the bottom — then slides up to 0,
  // making the previous step appear to rise up behind the header as the new one
  // arrives. Transform-only, and ONLY on a step change; expand/collapse keeps ty 0.
  const [tf, setTf] = useState<{ ty: number; anim: boolean }>({ ty: 0, anim: false });

  // fullH = whole block height; stepTop = top of the latest step (collapsed crop).
  const measure = () => {
    const slide = slideRef.current!;
    const kids = slide.children;
    const firstIdx = Math.max(0, kids.length - stepCount);
    const firstEl = kids[firstIdx] as HTMLElement | undefined;
    return { fullH: slide.offsetHeight, stepTop: firstEl ? firstEl.offsetTop : 0 };
  };
  const stopRaf = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (tfRafRef.current) cancelAnimationFrame(tfRafRef.current);
    rafRef.current = undefined;
    tfRafRef.current = undefined;
  };

  useLayoutEffect(() => {
    const slide = slideRef.current;
    const mask = maskRef.current;
    if (loading || !slide || !mask) return;
    const { fullH, stepTop } = measure();

    // collapsed-running shows just the latest step; done-collapsed shows nothing;
    // expanded shows everything (px while animating, then 'auto' so cards can open).
    const targetPx = expanded ? fullH : running ? fullH - stepTop : 0;
    const restH: number | 'auto' = expanded ? 'auto' : targetPx;

    clearTimeout(timerRef.current);
    stopRaf();

    // First paint — snap into place, no animation.
    if (!firstDone.current) {
      firstDone.current = true;
      setView({ h: restH, anim: false });
      prevExpandedRef.current = expanded;
      prevFullRef.current = fullH;
      return;
    }

    animatingRef.current = true;
    // Animating from 'auto' needs a px freeze first (auto isn't animatable).
    setView((prev) => {
      if (prev.h === 'auto') {
        rafRef.current = requestAnimationFrame(() =>
          requestAnimationFrame(() => setView({ h: targetPx, anim: true })),
        );
        return { h: fullH, anim: false };
      }
      return { h: targetPx, anim: true };
    });

    // Ticker transform — only on a collapsed-running step change (expanded
    // unchanged). Start shifted down by the added height, then slide up to 0.
    const isTicker = !expanded && running && prevExpandedRef.current === expanded;
    if (isTicker && prevFullRef.current != null && fullH > prevFullRef.current) {
      const delta = fullH - prevFullRef.current; // height the new step added
      setTf({ ty: delta, anim: false });
      tfRafRef.current = requestAnimationFrame(() =>
        requestAnimationFrame(() => setTf({ ty: 0, anim: true })),
      );
    } else {
      setTf({ ty: 0, anim: false });
    }
    prevExpandedRef.current = expanded;
    prevFullRef.current = fullH;

    // Settle on the height transition's actual end (fallback timer for no-transition
    // / cold paths). Once open, switch to 'auto' + visible so tool cards can expand.
    const settle = () => {
      stopRaf();
      clearTimeout(timerRef.current);
      mask.removeEventListener('transitionend', onEnd);
      animatingRef.current = false;
      setView({ h: restH, anim: false });
    };
    const onEnd = (e: TransitionEvent) => {
      if (e.propertyName === 'height') settle();
    };
    mask.addEventListener('transitionend', onEnd);
    timerRef.current = setTimeout(settle, MASK_MS + 120);
    return () => {
      mask.removeEventListener('transitionend', onEnd);
      stopRaf();
    };
  }, [expanded, running, status, visibleCount, loading, stepCount]);

  // Latest-step content growth (text streaming a new line): adjust the collapsed
  // crop SYNCHRONOUSLY, before paint, so the new line simply extends downward — no
  // async ResizeObserver lag that would clip/flash the top line for a frame. Height
  // stays instant (top line never moves); the new text fades in (TextRow) instead.
  // Skipped during the ticker/expand animation (the main effect owns height then).
  useLayoutEffect(() => {
    if (loading || expanded || !running || !firstDone.current || animatingRef.current) return;
    const slide = slideRef.current;
    if (!slide) return;
    const { fullH, stepTop } = measure();
    setView({ h: fullH - stepTop, anim: false });
    prevFullRef.current = fullH;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentKey]);

  useLayoutEffect(
    () => () => {
      clearTimeout(timerRef.current);
      stopRaf();
    },
    [],
  );

  // Collapsed-running: the mask is a fixed crop, so expanding a tool inside the
  // latest step would be clipped. Grow the mask to fit (the bottom-anchored last
  // step stays put; only the top crop changes).
  useEffect(() => {
    const slide = slideRef.current;
    if (!slide || expanded || !running || loading || typeof ResizeObserver === 'undefined') {
      return;
    }
    const ro = new ResizeObserver(() => {
      if (animatingRef.current) return;
      const { fullH, stepTop } = measure();
      setView({ h: fullH - stepTop, anim: false });
      // Keep prevFull current as the latest step grows (e.g. text streaming in) so
      // the NEXT step's ticker measures only the new step's height, not the growth.
      prevFullRef.current = fullH;
    });
    ro.observe(slide);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, running, loading, stepCount]);

  const auto = view.h === 'auto';
  const maskStyle: React.CSSProperties = {
    height: auto ? 'auto' : view.h,
    overflow: auto ? 'visible' : 'hidden',
    transition: view.anim ? `height ${MASK_MS}ms ${MASK_EASE}` : 'none',
  };
  const slideStyle: React.CSSProperties = {
    transform: `translateY(${tf.ty}px)`,
    transition: tf.anim ? `transform ${MASK_MS}ms ${MASK_EASE}` : 'none',
  };
  return { slideRef, maskRef, maskStyle, slideStyle };
}

// ── Main component ────────────────────────────────────────────────────────────

export const Reasoning: React.FC<ReasoningProps> = ({
  items,
  visibleCount,
  status,
  expanded,
  onToggleExpanded,
  loadedToolIds,
  triggerLeading,
}) => {
  const running = status === 'running';
  const revealed = items.slice(0, Math.max(0, Math.min(visibleCount, items.length)));
  const latest = revealed[revealed.length - 1];
  const loading = running && !latest; // nothing streamed yet

  // The latest step may span multiple parallel rows; the collapsed mask shows all
  // of them and the header is derived from the step's mix.
  const stepCount = latestStepItems(revealed).length;
  const collapsedHeader = toolStepLabel(latestStepItems(revealed));

  // Bumps when the latest text step streams in more characters, so the mask can
  // re-crop synchronously (before paint) as the text grows another line.
  const contentKey = latest && latest.kind === 'text' ? latest.text.length : revealed.length;

  // One masked block: all steps live in a single slide inside a mask pinned under
  // the header. The hook measures the latest step and animates mask-height +
  // block-translate together, so collapse/expand AND the step-to-step ticker are
  // the same motion (the response below follows the mask height).
  const { slideRef, maskRef, maskStyle, slideStyle } = useCollapsibleMask({
    expanded,
    running,
    status,
    visibleCount,
    loading,
    stepCount,
    contentKey,
  });

  // Responsive right padding — collapses the extra 48px first, then the content
  // shrinks with the column (see useReasoningPadding).
  const { ref: rootRef, padRight } = useReasoningPadding();

  // Build the timeline rows; the final revealed row is terminal (no line / space).
  // Text steps: collapsed → line only (from y0, no dot); expanded → dot in its
  // 20×20 box with the line starting below it (y22). Tools keep their icon.
  const rows = revealed.map((item) =>
    item.kind === 'text' ? (
      <TextRow key={item.id} text={item.text} lineOnly={!expanded} />
    ) : (
      <ToolRow
        key={item.id}
        item={item}
        loading={loadedToolIds ? !loadedToolIds.has(item.id) : false}
        loadedToolIds={loadedToolIds}
      />
    ),
  );
  // "Done" only exists in the expanded view, so it never flashes during collapse.
  if (status === 'done' && expanded) rows.push(<DoneRow key="done" />);
  if (rows.length > 0) {
    rows[rows.length - 1] = React.cloneElement(rows[rows.length - 1], {
      terminal: true,
    } as { terminal: boolean });
  }

  // No header→steps gap in the done + collapsed "Show work" state (the mask is
  // empty); keep it for semi-collapsed and expanded.
  const collapsedEmpty = status === 'done' && !expanded;

  return (
    <div
      ref={rootRef}
      className={styles.reasoning}
      data-expanded={expanded}
      style={{ paddingRight: padRight, ...(collapsedEmpty ? { gap: 0 } : {}) }}
    >
      {/* Header / trigger */}
      <button
        type="button"
        className={styles.trigger}
        data-expanded={expanded}
        onClick={onToggleExpanded}
        aria-expanded={expanded}
      >
        {triggerLeading}
        {loading ? (
          <BouncingDots />
        ) : (
          <>
            <span className={running ? styles.shimmer : undefined}>
              {running ? (expanded ? 'Working' : collapsedHeader) : 'Show work'}
            </span>
            <span className={styles.chevron} data-expanded={expanded}>
              <Icon name="chevron-right" size="s" />
            </span>
          </>
        )}
      </button>

      {/* Masked block — bottom-anchored clip; only its height animates (inline).
          The opacity fade is ONLY for the done-state open/close ("Show work"). While
          running, no fade — the body expands/collapses seamlessly via height + the
          ticker, exactly as before (a fade there reads as a jarring dissolve). */}
      {!loading && (
        <div ref={maskRef} className={styles.mask} style={maskStyle}>
          <div
            ref={slideRef}
            className={`${styles.maskSlide} ${
              running ? '' : expanded ? styles.fadeIn : styles.fadeOut
            }`}
            style={slideStyle}
          >
            {rows}
          </div>
        </div>
      )}
    </div>
  );
};

Reasoning.displayName = 'Reasoning';

// ── Rows ───────────────────────────────────────────────────────────────────────

// Left rail: a 20×20 box holding the dot/icon, then a 1px line that fills the
// rest of the row height (including the 16px bottom spacing). The line is hidden
// on the final row via CSS, so the timeline connects every block but the last.
const RowMarker: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className={styles.markerCol} aria-hidden="true">
    <span className={styles.iconBox}>{children}</span>
    <span className={styles.line} />
  </span>
);

// Bouncing dots — shown as the first step while the agent spins up, before any
// text/tool has streamed in.
const BouncingDots: React.FC = () => (
  <div className={styles.dotsRow} role="status" aria-label="Working">
    <span className={styles.bounceDot} />
    <span className={styles.bounceDot} />
    <span className={styles.bounceDot} />
  </div>
);

// `lineOnly` (semi-collapsed text step): no dot — just a 1px line spanning the
// full height of the block, top to bottom.
const TextRow: React.FC<{ text: string; lineOnly?: boolean; terminal?: boolean }> = ({
  text,
  lineOnly,
  terminal,
}) => {
  // Smooth the streamed reveal: split the text into the already-shown head and the
  // newly-appended tail. The tail span is keyed by length so its fade-in replays
  // on every chunk, while the head stays put. (On first mount the whole text is the
  // "tail" → a single gentle fade-in; when the text changes to something that isn't
  // an extension of the previous value, it renders in full with no fade.)
  const prevRef = useRef('');
  const prev = prevRef.current;
  // extension → fade just the new chunk; unchanged → no fade; anything else
  // (first mount, a new/restarted text) → fade the whole thing in once.
  const isExtension = text.startsWith(prev) && text.length > prev.length;
  const head = isExtension ? prev : text === prev ? text : '';
  const tail = isExtension ? text.slice(prev.length) : text === prev ? '' : text;
  useEffect(() => {
    prevRef.current = text;
  }, [text]);

  return (
    <div className={styles.row} data-kind="text" data-terminal={terminal || undefined}>
      {lineOnly ? (
        <span className={styles.markerCol} aria-hidden="true">
          <span className={styles.lineFull} />
        </span>
      ) : (
        <RowMarker>
          <span className={styles.dot} />
        </RowMarker>
      )}
      <div className={styles.content}>
        <p className={styles.text}>
          {head}
          {tail && (
            <span key={text.length} className={styles.streamChunk}>
              {tail}
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

const DoneRow: React.FC<{ terminal?: boolean }> = ({ terminal }) => (
  <div className={styles.row} data-terminal={terminal || undefined}>
    <RowMarker>
      <span className={styles.dot} />
    </RowMarker>
    <div className={styles.content}>
      <p className={styles.text}>Done</p>
    </div>
  </div>
);

// ── CodeSection — a label + a rounded code card (header: language + copy) ──────
// Per Figma 407-25918: label above the card; card header has the language tag and
// a copy button; the code area scrolls once the card reaches its 180px max height.

const CodeSection: React.FC<{
  label: string;
  code: string;
  lang?: string;
  /** error → red block, no header, plain (not syntax-highlighted) message. */
  tone?: 'default' | 'error';
}> = ({ label, code, lang = 'js', tone = 'default' }) => {
  const error = tone === 'error';
  const handleCopy = () => navigator.clipboard?.writeText(code);
  return (
    <div className={styles.codeSection}>
      <span className={styles.sectionLabel}>{label}</span>
      <div className={`${styles.codeBlock} ${error ? styles.codeBlockError : ''}`}>
        {!error && (
          <div className={styles.codeHeader}>
            <span className={styles.langTag}>{lang}</span>
            <button type="button" className={styles.copyBtn} onClick={handleCopy} title="Copy">
              <Icon name="copy" size="s" />
            </button>
          </div>
        )}
        <div className={styles.codeScroll}>
          <pre className={`${styles.pre} ${error ? styles.preError : ''}`}>
            {error ? code : <code><CodeHighlight code={code} /></code>}
          </pre>
        </div>
      </div>
    </div>
  );
};

// Input/Output blocks shared by tool rows and nested code-execution rows. When
// `error` is set, the Output is the red error/denial message.
const ToolCodeCard: React.FC<{ input: string; output?: string; error?: string }> = ({
  input,
  output,
  error,
}) => (
  <div className={styles.codeCard}>
    <CodeSection label="Input" code={input} />
    {error ? (
      <CodeSection label="Output" code={error} tone="error" />
    ) : (
      output && <CodeSection label="Output" code={output} />
    )}
  </div>
);

// ── Visualization card — the "Visualizing data" tool (Figma 430-105788) ───────
// Input is the NL question (plain text); Output is the chart: query-token chips, a
// table/chart toggle, then an area chart (chart area caps at 272px).

// Small inline glyphs — the query-token funnel and the toggle's table / chart icons.
const FunnelIcon: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M1.5 2.25h9L7 6.5v3.25L5 10.75V6.5L1.5 2.25Z" fill="currentColor" />
  </svg>
);
const TableGlyph: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <rect x="1.5" y="2.5" width="11" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
    <path d="M1.5 5.5h11M5.5 5.5v6" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);
const ChartGlyph: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M2 12V2M2 12h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <rect x="3.75" y="7" width="2" height="3.5" rx="0.5" fill="currentColor" />
    <rect x="6.75" y="4.5" width="2" height="6" rx="0.5" fill="currentColor" />
    <rect x="9.75" y="6" width="2" height="4.5" rx="0.5" fill="currentColor" />
  </svg>
);

const TOKEN_CLASS: Record<ChartToken['kind'], string> = {
  measure: styles.vizTokenMeasure,
  date: styles.vizTokenDate,
  filter: styles.vizToken,
  keyword: styles.vizToken,
};

// Filled area chart — last point is a dashed "projection" ending in a dot. The
// stroke is non-scaling so it stays crisp as the SVG stretches to the card width.
const AreaChart: React.FC<{ series: ChartViz['series'] }> = ({ series }) => {
  const W = 600;
  const H = 232;
  const PT = 12; // top padding so the peak isn't clipped
  const n = series.length;
  const max = Math.max(...series.map((s) => s.value), 1);
  const pts = series.map((s, i) => ({
    x: n > 1 ? (i / (n - 1)) * W : 0,
    y: H - PT - (s.value / max) * (H - PT),
  }));
  const line = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`);
  const solid = line.slice(0, n - 1).join(' '); // solid up to the projected point
  const last = pts[n - 1];
  const prev = pts[n - 2];
  const area = `M0,${H} L${line.join(' L')} L${W},${H} Z`;
  return (
    <svg className={styles.vizSvg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Area chart">
      <path d={area} className={styles.vizArea} />
      <polyline points={solid} className={styles.vizLine} vectorEffect="non-scaling-stroke" />
      {prev && (
        <line
          x1={prev.x} y1={prev.y} x2={last.x} y2={last.y}
          className={styles.vizProjection} vectorEffect="non-scaling-stroke"
        />
      )}
      <circle cx={last.x} cy={last.y} r="3.5" className={styles.vizEndDot} vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

const VizTable: React.FC<{ series: ChartViz['series'] }> = ({ series }) => (
  <div className={styles.vizTableWrap}>
    <table className={styles.vizTable}>
      <tbody>
        {series.map((s) => (
          <tr key={s.label}>
            <td className={styles.vizTableLabel}>{s.label}</td>
            <td className={styles.vizTableValue}>{s.value.toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const VizCard: React.FC<{ chart: ChartViz }> = ({ chart }) => {
  const [mode, setMode] = useState<'chart' | 'table'>('chart');
  return (
    <div className={styles.codeCard}>
      <div className={styles.vizSection}>
        <span className={styles.sectionLabel}>Input</span>
        <p className={styles.vizQuestion}>{chart.question}</p>
      </div>
      <div className={styles.vizSection}>
        <span className={styles.sectionLabel}>Output</span>
        <div className={styles.vizOutput}>
          <div className={styles.vizHeader}>
            {chart.tokens && (
              <div className={styles.vizTokens}>
                {chart.tokens.map((t, i) => (
                  <span key={i} className={`${styles.vizToken} ${TOKEN_CLASS[t.kind]}`}>
                    {t.kind === 'filter' && (
                      <span className={styles.vizTokenIcon}><FunnelIcon /></span>
                    )}
                    {t.label}
                  </span>
                ))}
              </div>
            )}
            <div className={styles.vizToggle} role="tablist" aria-label="View as">
              <button
                type="button"
                className={`${styles.vizToggleBtn} ${mode === 'table' ? styles.vizToggleBtnActive : ''}`}
                onClick={() => setMode('table')}
                aria-label="Table view"
                aria-selected={mode === 'table'}
              >
                <TableGlyph />
              </button>
              <button
                type="button"
                className={`${styles.vizToggleBtn} ${mode === 'chart' ? styles.vizToggleBtnActive : ''}`}
                onClick={() => setMode('chart')}
                aria-label="Chart view"
                aria-selected={mode === 'chart'}
              >
                <span className={mode === 'chart' ? styles.vizChartIconActive : undefined}><ChartGlyph /></span>
              </button>
            </div>
          </div>
          <div className={styles.vizChart}>
            {mode === 'chart' ? <AreaChart series={chart.series} /> : <VizTable series={chart.series} />}
          </div>
        </div>
      </div>
    </div>
  );
};

// Title + chevron button shared by tool rows and nested rows. `error` turns the
// title (and chevron) red.
const ToolHeaderButton: React.FC<{
  title: string;
  open: boolean;
  onToggle: () => void;
  error?: boolean;
  /** Shimmer the title while the (nested) tool is still running — keeps the chevron. */
  shimmer?: boolean;
}> = ({ title, open, onToggle, error, shimmer }) => (
  <button
    type="button"
    className={styles.toolHeader}
    data-error={error || undefined}
    onClick={onToggle}
    aria-expanded={open}
  >
    <span className={`${styles.toolTitle} ${shimmer ? styles.shimmer : ''}`}>{title}</span>
    <span className={styles.toolChevron} data-open={open}>
      <Icon name="chevron-right" size="s" />
    </span>
  </button>
);

// Smooth slide in/out wrapper. The inner div (no padding/border/margin) is the
// grid child so the 0fr track can fully collapse; the content sits inside it.
// Once fully open, overflow goes visible so popovers (e.g. the permission menu)
// aren't clipped; while animating/closing it stays clipped for the slide.
const Collapsible: React.FC<{ open: boolean; children: React.ReactNode }> = ({ open, children }) => {
  const [settled, setSettled] = useState(open);
  useEffect(() => {
    if (!open) {
      setSettled(false);
      return;
    }
    const t = setTimeout(() => setSettled(true), SLIDE_MS); // after the slide completes
    return () => clearTimeout(t);
  }, [open]);
  return (
    <div className={styles.codeWrap} data-open={open} data-settled={settled || undefined}>
      <div className={styles.codeWrapInner}>{children}</div>
    </div>
  );
};

// Nested code-execution block (double accordion): an LLM-summary header that
// expands to its own Input/Output card. Indented under its parent tool call.
const NestedExecRow: React.FC<{ exec: CodeExecution; loading?: boolean }> = ({ exec, loading }) => {
  const [open, setOpen] = useState(false);
  // While this sub-step is still running: shimmer the present-tense header, no
  // chevron, no body — same treatment as a top-level loading tool.
  if (loading) {
    return (
      <div className={styles.nestedRow}>
        <div className={styles.toolLoading}>
          <span className={`${styles.toolTitle} ${styles.shimmer}`}>
            {exec.loadingHeader ?? exec.summaryHeader}
          </span>
        </div>
      </div>
    );
  }
  return (
    <div className={styles.nestedRow}>
      <ToolHeaderButton title={exec.summaryHeader} open={open} onToggle={() => setOpen((p) => !p)} />
      <Collapsible open={open}>
        {exec.chart ? (
          <VizCard chart={exec.chart} />
        ) : (
          <ToolCodeCard input={exec.input ?? ''} output={exec.output} />
        )}
      </Collapsible>
    </div>
  );
};

// ── MCP permission prompt — shown in an expanded connector tool awaiting approval.
// Figma 410-61998: bordered card, title + description, "Allow once" split button
// (with an "Always allow" menu) + "Deny".

const PermissionCard: React.FC<{
  action: string;
  description?: string;
  onAllowOnce?: () => void;
  onAlwaysAllow?: () => void;
  onDeny?: () => void;
}> = ({ action, description, onAllowOnce, onAlwaysAllow, onDeny }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className={styles.permCard}>
      <div className={styles.permText}>
        <p className={styles.permTitle}>Allow {action}?</p>
        <p className={styles.permDesc}>
          {description ?? 'Only necessary information will be accessed to fulfil this query.'}
        </p>
      </div>
      <div className={styles.permActions}>
        <div className={styles.splitBtn}>
          <button type="button" className={styles.splitMain} onClick={onAllowOnce}>
            Allow once
          </button>
          <div className={styles.splitMenuWrap}>
            <button
              type="button"
              className={styles.splitChevron}
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="More permission options"
              aria-expanded={menuOpen}
            >
              <Icon name="chevron-down" size="s" />
            </button>
            {menuOpen && (
              <div className={styles.permMenu} role="menu">
                <button
                  type="button"
                  className={styles.permMenuItem}
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onAlwaysAllow?.();
                  }}
                >
                  Always allow
                </button>
              </div>
            )}
          </div>
        </div>
        <button type="button" className={styles.denyBtn} onClick={onDeny}>
          Deny
        </button>
      </div>
    </div>
  );
};

// ── ToolRow ────────────────────────────────────────────────────────────────────

export const ToolRow: React.FC<{
  item: Extract<ReasoningItem, { kind: 'tool' }>;
  terminal?: boolean;
  /** Loading: shimmer title, no chevron/hover, not expandable. */
  loading?: boolean;
  /** Start expanded (used by the gallery to show the body without a click). */
  defaultOpen?: boolean;
  /** Set of finished tool / sub-step ids — drives nested-tool sub-step loading. */
  loadedToolIds?: Set<string>;
}> = ({ item, terminal, loading, defaultOpen, loadedToolIds }) => {
  // Nested tool (SpotQL-style, two steps in one): the parent stays clickable and
  // expanded WHILE loading so its sub-steps reveal their own progress. Each
  // sub-step is "done" once its id lands in loadedToolIds; with no set we fall
  // back to the plain `loading` flag (used by the static gallery).
  const steps = item.codeExecutions;
  const isNested = !!steps && steps.length > 0;
  const stepDone = (id: string) => (loadedToolIds ? loadedToolIds.has(id) : !loading);
  const allStepsDone = isNested && steps!.every((ce) => stepDone(ce.id));
  const nestedLoading = isNested && !allStepsDone;

  // How many sub-steps are revealed so far (step N appears once step N-1 is done).
  const revealedCount = isNested
    ? steps!.filter((_, i) => i === 0 || stepDone(steps![i - 1].id)).length
    : 0;

  // Count-nest (code execution / answer generation): while only the first sub-step
  // is running it renders as a plain, non-clickable `nest.singular` row — the nest
  // (and the chevron) only appear once a 2nd sub-step begins, at which point the
  // parent title becomes a count built from the nest labels.
  const nest = isNested ? item.nest : undefined;
  const asSingleNest = !!nest && revealedCount <= 1 && !allStepsDone;
  const nestTitle = nest
    ? allStepsDone
      ? `${nest.doneVerb} ${steps!.length} ${nest.unit}`
      : `${nest.runningVerb} ${revealedCount} ${nest.unit}`
    : nestedLoading
      ? item.title
      : item.doneTitle ?? item.title;

  // Permission gate: a connector tool awaiting approval shows the card until it
  // resolves. It resolves once its id lands in loadedToolIds (approved → the call
  // runs); with no set (the static gallery) it stays pending so the card is shown.
  const permissionPending =
    !!item.permission && (loadedToolIds ? !loadedToolIds.has(item.id) : true);

  // A count-nest stays closed by default; the SpotQL-style nest auto-expands while
  // loading so its sub-step progress is visible.
  const [open, setOpen] = useState(defaultOpen ?? (isNested && nestedLoading && !nest));

  return (
    <div className={styles.row} data-terminal={terminal || undefined}>
      <RowMarker>
        {item.logo ? (
          <img
            src={slackLogo}
            width={12}
            height={12}
            alt={item.connector ?? 'Connector'}
            style={{ borderRadius: 3, display: 'block' }}
          />
        ) : item.toolIcon ? (
          <ToolIcon name={item.toolIcon} />
        ) : (
          <Icon name={item.icon ?? 'spotter'} size="s" />
        )}
      </RowMarker>

      <div className={styles.content}>
        {asSingleNest ? (
          // Count-nest, first sub-step only: not yet a nest, so it looks like a
          // plain single loading tool (shimmer title, no chevron, no body).
          <div className={styles.toolLoading}>
            <span className={`${styles.toolTitle} ${styles.shimmer}`}>{nest!.singular}</span>
          </div>
        ) : isNested ? (
          // Nested tool: header stays a clickable chevron button at all times
          // (shimmering while the tool is still running). Sub-steps reveal one at
          // a time — step N appears once step N-1 is done — and each shimmers
          // while running, then turns solid + expandable when it completes.
          <>
            <ToolHeaderButton
              title={nestTitle}
              open={open}
              onToggle={() => setOpen((p) => !p)}
              error={!!item.error}
              shimmer={nestedLoading}
            />
            <Collapsible open={open}>
              <div className={styles.nested}>
                {steps!.map((ce, i) => {
                  const revealed = i === 0 || stepDone(steps![i - 1].id);
                  if (!revealed) return null;
                  return <NestedExecRow key={ce.id} exec={ce} loading={!stepDone(ce.id)} />;
                })}
              </div>
            </Collapsible>
          </>
        ) : permissionPending || loading ? (
          // Loading OR awaiting permission: the tool is still running, so the
          // header is the shimmer title (no chevron). When a permission is
          // pending, the approval card shows below it; once approved it resolves
          // to the normal done state.
          <>
            <div className={styles.toolLoading}>
              <span className={`${styles.toolTitle} ${styles.shimmer}`}>{item.title}</span>
            </div>
            {permissionPending && item.permission && (
              <PermissionCard
                action={item.permission.action}
                description={item.permission.description}
              />
            )}
          </>
        ) : (
          <>
            <ToolHeaderButton
              title={item.doneTitle ?? item.title}
              open={open}
              onToggle={() => setOpen((p) => !p)}
              error={!!item.error}
            />
            <Collapsible open={open}>
              {item.chart ? (
                <VizCard chart={item.chart} />
              ) : (
                <ToolCodeCard input={item.input ?? ''} output={item.output} error={item.error} />
              )}
            </Collapsible>
          </>
        )}
      </div>
    </div>
  );
};

// ── Semi-collapsed view ─────────────────────────────────────────────────────────

export interface SemiCollapsedProps {
  step: LatestStep;
  /** Optional — invoked when the shimmer header is clicked (e.g. to expand fully). */
  onToggle?: () => void;
}

// Shimmer header + the latest ongoing step, rendered with the SAME rows as the
// expanded timeline. Only the last tool is terminal (no trailing line); in a
// parallel step the earlier tools keep their connecting line.
export const SemiCollapsed: React.FC<SemiCollapsedProps> = ({ step, onToggle }) => {
  const { ref: rootRef, padRight } = useReasoningPadding();
  return (
  <div ref={rootRef} className={styles.reasoning} style={{ paddingRight: padRight }}>
    <button
      type="button"
      className={styles.trigger}
      data-expanded="false"
      onClick={onToggle}
      aria-expanded={false}
    >
      <span className={styles.shimmer}>{toolStepLabel(stepItemsOf(step))}</span>
      <span className={styles.chevron} data-expanded="false">
        <Icon name="chevron-right" size="s" />
      </span>
    </button>

    <div className={`${styles.steps} ${styles.semiSteps}`}>
      {step.kind === 'text' ? (
        <TextRow text={step.text} lineOnly terminal />
      ) : (
        step.tools.map((tool, i) => (
          <ToolRow key={tool.id} item={tool} terminal={i === step.tools.length - 1} />
        ))
      )}
    </div>
  </div>
  );
};

SemiCollapsed.displayName = 'SemiCollapsed';

export default Reasoning;
