import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fontFamily, fontWeight, fontSize } from '@tokens/typography';
import { systemColors } from '@tokens/colors';
import { spacing } from '@tokens/spacing';
import { Button } from '@components/Button';
import { Link } from '@components/Link';
import { GridViewIcon } from '@components/icons';
import type { DataConnection } from '../data/mockData';
import { ReasoningBlock } from '../../_agentic/ReasoningBlock';
import type { ReasoningData } from '../../_agentic/ReasoningBlock';
import { ClarifyingCard } from './ClarifyingCard';
import type { ClarifyQuestion } from './ClarifyingCard';
import { DirectionCard } from './DirectionCard';
import type { Direction } from './DirectionCard';
import '../../DataModelEditor/dme.css';

// DME SpotterModel gradient palette — matches the rotating conic border in dme.css.
// #48D1E0 is the cyan stop used by the DME; no Radiant token exists for it.
const DME_CYAN = '#48D1E0';


const PROMPT_PLACEHOLDER = "Write this model's use case, business questions it should answer";

// ─── Highlighted text — solid Radiant primary blue
function GradText({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ color: systemColors.light['content-brand'] }}>
      {children}
    </span>
  );
}

// ─── SpotterModel avatar — uses the canonical asset from /spotter-assets/ ──────
// Displayed at 64×64 for the hero context (SVG scales perfectly from its 32×32 base).
function AgentAvatar() {
  return (
    <img
      src="/spotter-assets/SpotterModel avatar.svg"
      width={64}
      height={64}
      alt="SpotterModel"
      style={{ display: 'block' }}
    />
  );
}

// ─── Sparkle / lightbulb hint icon — custom SVG, kept as-is ──────────────────
function SparkleIcon({ color = systemColors.light['content-secondary'] }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" fill="none" aria-hidden style={{ flexShrink: 0 }}>
      <path d="M37.8935 0.946728C38.1203 3.19863 39.1121 5.30445 40.7035 6.91443C42.2946 8.52353 44.3891 9.53915 46.638 9.79218C47.1737 9.85451 47.5763 10.3092 47.573 10.8479C47.5703 11.3869 47.1621 11.8372 46.6263 11.8935C44.375 12.1206 42.2686 13.1121 40.6592 14.7039C39.0495 16.2948 38.0339 18.3893 37.7814 20.6384C37.7191 21.1741 37.2638 21.5765 36.7251 21.5732C36.1861 21.5705 35.7364 21.1626 35.6801 20.6267C35.4525 18.3752 34.4609 16.2687 32.8698 14.6596C31.2784 13.0497 29.1839 12.034 26.9348 11.7816C26.3999 11.7189 25.9967 11.264 26 10.7253C26.0027 10.1863 26.4109 9.73599 26.9467 9.67966C29.1986 9.45285 31.3044 8.46106 32.9136 6.86991C34.5235 5.27842 35.5391 3.18393 35.7916 0.934774C35.8543 0.399928 36.3089 -0.00268115 36.8479 1.3446e-05C37.3867 0.00328346 37.8372 0.410855 37.8935 0.946728Z" fill={color}/>
      <path d="M34 29.5732C35.5873 27.986 36.9999 26.3098 38.0552 24.4866C36.6273 24.7779 34.8008 24.5814 33.3748 23.3644C32.6215 24.4316 31.7284 25.4209 30.8118 26.3375C28.5049 28.6443 27.6434 31.5732 27.6434 33.5732H20.6765C20.6765 31.6514 19.4935 28.6443 17.1866 26.3375C14 23.1508 12.5582 21.0531 12.5582 17.5732C12.5582 11.5475 17.6909 6.64429 24 6.64429C24.9424 6.64429 25.8587 6.75375 26.7354 6.96007C27.7873 7.2076 30.6176 5.58201 31.6493 4.15107C29.3758 2.96415 26.7694 2.28906 24.0008 2.28906C15.1777 2.28906 8 9.14568 8 17.5733C8 22.3635 10.4405 26.0138 14 29.5732C16.6757 32.249 16.6757 35.5732 16.6757 35.6901V37.5732H31.6495V35.6918C31.6495 35.6918 31.6495 31.9238 34 29.5732Z" fill={color}/>
      <path d="M16.6757 40.0342H31.6412V43.2095C31.6412 44.0739 31.1185 44.7833 30.4793 44.7833H27.5917V46.0967C27.5917 47.1474 26.5727 47.5189 26.0135 47.5733H22.0135C21.1073 47.5733 20.4744 46.8936 20.4744 46.0342V44.7833H17.9062C17.2297 44.7833 16.6757 44.0739 16.6757 43.2095V40.0342Z" fill={color}/>
      <path d="M8.80913 37.1153C7.84887 36.1547 7.24671 34.8946 7.10305 33.5442C7.06745 33.2229 6.79574 32.9799 6.4725 32.9797C6.1491 32.9799 5.87767 33.223 5.84187 33.5441C5.69797 34.8944 5.09566 36.1545 4.13507 37.1148C3.17497 38.0749 1.91484 38.6771 0.564503 38.8208C0.243179 38.8564 -0.000194398 39.1279 1.16515e-07 39.4513C-0.000151553 39.7746 0.243288 40.0462 0.564396 40.082C1.9147 40.2258 3.17479 40.8281 4.13507 41.7887C5.09514 42.7488 5.69715 44.0093 5.8413 45.3595C5.8769 45.6808 6.14811 45.924 6.4715 45.9238C6.79475 45.924 7.06653 45.681 7.10212 45.3594C7.24603 44.0091 7.84834 42.749 8.80877 41.7891C9.76902 40.8286 11.0295 40.2266 12.3795 40.0828C12.7008 40.0472 12.9442 39.7756 12.944 39.4522C12.9441 39.129 12.7011 38.8575 12.3795 38.8219C11.0293 38.6777 9.76921 38.0754 8.80913 37.1153Z" fill={color}/>
    </svg>
  );
}

// ─── Connection split-button ───────────────────────────────────────────────────
// ─── Build button — custom gradient arrow pill, kept as raw button ─────────────
function BuildButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-label="Submit"
      style={{
        width: spacing.H, height: spacing.H, borderRadius: '50%',
        background: systemColors.light['content-brand'],
        border: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'default' : 'pointer',
        transition: 'opacity 0.15s',
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = disabled ? '0.4' : '1'; }}
    >
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d="M8 13V4M4 8l4-4 4 4"
          stroke="white"
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

// ─── Shared prompt bar border helper — matches DME .prompt-bar:focus-within
// Uses rotating conic gradient: purple → cyan → brand-blue → purple (4s loop).
function promptBorderStyle(focused: boolean): React.CSSProperties {
  if (focused) {
    return {
      borderColor: 'transparent',
      backgroundImage: `linear-gradient(white, white), conic-gradient(from var(--gradient-angle), ${systemColors.light['content-accent-purple']}, ${DME_CYAN}, ${systemColors.light['content-brand']}, ${systemColors.light['content-accent-purple']})`,
      backgroundOrigin: 'border-box',
      backgroundClip: 'padding-box, border-box',
      animation: 'rotate-border 4s linear infinite',
    };
  }
  return { borderColor: systemColors.light['border-divider'] };
}

// Prototype-specific elevation — no Radiant shadow token at this depth.
const PROMPT_BAR_SHADOW = '0px 2px 4px rgba(25,35,49,0.04), 0px 0px 4px rgba(25,35,49,0.10)';

// ─── Default prompt bar ────────────────────────────────────────────────────────
function PromptBar({
  onTextChange, onHtmlChange, onSubmit, connectionName, onConnectionClick: _onConnectionClick, onShowConnectionDetails: _onShowConnectionDetails, initialText, submitDisabled,
}: {
  onTextChange: (text: string) => void;
  onHtmlChange?: (html: string) => void;
  onSubmit: () => void;
  connectionName: string; onConnectionClick: () => void; onShowConnectionDetails: () => void;
  initialText?: string;
  submitDisabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const placeholder = PROMPT_PLACEHOLDER;

  return (
    <div
      style={{
        width: '100%', display: 'flex', flexDirection: 'column',
        borderRadius: spacing.C, padding: spacing.D, gap: spacing.D,
        border: '1px solid', background: 'white',
        boxShadow: PROMPT_BAR_SHADOW, ...promptBorderStyle(focused),
      }}
    >
      <MentionEditor
        placeholder={placeholder}
        initialText={initialText}
        onTextChange={onTextChange}
        onHtmlChange={onHtmlChange}
        onFocusChange={setFocused}
        onSubmit={onSubmit}
        connectionName={connectionName}
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', height: spacing.H }}>
        {/* ConnectionSelector hidden for now — may restore later */}
        <BuildButton onClick={onSubmit} disabled={submitDisabled} />
      </div>
    </div>
  );
}

const CONNECTION_TABLES = [
  'fact_sales_orders', 'fact_sales_pipeline', 'fact_customer_transactions',
  'fact_revenue_daily', 'fact_opportunity_stage',
  'dim_customers', 'dim_products', 'dim_sales_reps',
  'dim_regions', 'dim_date', 'dim_channels', 'dim_accounts',
  'bridge_customer_accounts', 'bridge_product_categories',
  'stg_salesforce_opportunities', 'stg_salesforce_accounts',
  'stg_salesforce_contacts', 'stg_stripe_charges', 'stg_stripe_customers',
  'agg_sales_by_region', 'agg_revenue_monthly', 'agg_customer_lifetime_value',
  'mart_sales_performance', 'mart_customer_360', 'mart_pipeline_analysis',
];

/** Shared helper — deletes the trigger+query text from the anchor node and inserts
 *  a chip element at that position, followed by a trailing space. */
function insertChip(chip: HTMLSpanElement, sel: Selection, trigger: '@' | '#'): void {
  const anchor = sel.anchorNode;
  if (anchor?.nodeType === Node.TEXT_NODE) {
    const full = anchor.textContent ?? '';
    const pos  = sel.anchorOffset;
    const idx  = full.slice(0, pos).lastIndexOf(trigger);
    if (idx !== -1) {
      anchor.textContent = full.slice(0, idx) + full.slice(pos);
      const rr = document.createRange();
      rr.setStart(anchor, idx);
      rr.collapse(true);
      sel.removeAllRanges();
      sel.addRange(rr);
    }
  }
  const r = sel.getRangeAt(0);
  r.insertNode(chip);
  const space = document.createTextNode(' ');
  const after = document.createRange();
  after.setStartAfter(chip);
  after.insertNode(space);
  after.setStartAfter(space);
  after.collapse(true);
  sel.removeAllRanges();
  sel.addRange(after);
}

// ─── Inline @mention editor ───────────────────────────────────────────────────
// @ — opens a table autocomplete dropdown; selecting a row inserts a blue chip.
// React does NOT control the DOM content — the ref is the source of truth.
function MentionEditor({
  placeholder,
  initialText,
  onTextChange,
  onHtmlChange,
  onFocusChange,
  onSubmit,
  connectionName,
}: {
  placeholder: string;
  initialText?: string;
  onTextChange: (text: string) => void;
  onHtmlChange?: (html: string) => void;
  onFocusChange: (focused: boolean) => void;
  onSubmit: () => void;
  connectionName?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [mentionQuery,  setMentionQuery]  = useState<string | null>(null);
  const [activeIdx,     setActiveIdx]     = useState(0);
  const [isEmpty,       setIsEmpty]       = useState(!initialText);

  // On mount: restore initial text (e.g. when navigating back from directions),
  // then focus so the gradient border animates immediately.
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (initialText) {
      editor.innerText = initialText;
      setIsEmpty(false);
      onTextChange(initialText);
    }
    editor.focus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const suggestions = mentionQuery !== null
    ? CONNECTION_TABLES.filter(t => t.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 8)
    : [];

  // Read only the anchor text node — NOT the full editor range.
  // Using the full range would include text from committed chip spans
  // (which are separate non-editable nodes) and cause false trigger detections.
  const detectMention = (): string | null => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;
    const anchor = sel.anchorNode;
    if (!anchor || anchor.nodeType !== Node.TEXT_NODE) return null;
    const before = (anchor.textContent ?? '').slice(0, sel.anchorOffset);
    const mAt = before.match(/@(\w*)$/);
    return mAt ? mAt[1] : null;
  };

  const handleInput = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const text  = editor.innerText ?? '';
    const empty = !text.trim() || text === '\n';
    setIsEmpty(empty);
    onTextChange(empty ? '' : text);
    onHtmlChange?.(empty ? '' : editor.innerHTML);
    const mention = detectMention();
    setMentionQuery(mention);
    if (mention !== null) setActiveIdx(0);
  };


  // Commit @tableName chip — grid icon + table name, no @ prefix
  const commitMention = (tableName: string) => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;

    const bg = systemColors.light['background-information'];
    const fg = systemColors.light['content-brand'];

    const chip = document.createElement('span');
    chip.setAttribute('data-table', tableName);
    chip.setAttribute('contenteditable', 'false');
    chip.style.cssText = [
      'display:inline-block',
      `background:${bg}`,
      `color:${fg}`,
      'border-radius:6px',
      'padding:2px 8px 2px 5px',
      'font-size:13px',
      'font-weight:375',
      'margin:0 2px',
      'white-space:nowrap',
      'cursor:default',
      'user-select:none',
      'vertical-align:text-bottom',
      'line-height:20px',
    ].join(';');

    // GridViewIcon xs — paths from @components/icons/icons/GridView.tsx (fill="currentColor" inherits fg)
    chip.innerHTML = [
      `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"`,
      ` style="display:inline-block;vertical-align:middle;margin-right:4px;margin-bottom:1px">`,
      `<path d="M1.33329 2C0.965103 2 0.666626 2.29848 0.666626 2.66667V4.66667C0.666626 5.03486 0.965103 5.33333 1.33329 5.33333H4.66663C5.03482 5.33333 5.33329 5.03486 5.33329 4.66667V2.66667C5.33329 2.29848 5.03482 2 4.66663 2H1.33329Z" fill="currentColor"/>`,
      `<path d="M1.33329 6.66667C0.965103 6.66667 0.666626 6.96514 0.666626 7.33333V9.33333C0.666626 9.70152 0.965103 10 1.33329 10H4.66663C5.03482 10 5.33329 9.70152 5.33329 9.33333V7.33333C5.33329 6.96514 5.03482 6.66667 4.66663 6.66667H1.33329Z" fill="currentColor"/>`,
      `<path d="M6.66663 2.66667C6.66663 2.29848 6.9651 2 7.33329 2H10.6666C11.0348 2 11.3333 2.29848 11.3333 2.66667V4.66667C11.3333 5.03486 11.0348 5.33333 10.6666 5.33333H7.33329C6.9651 5.33333 6.66663 5.03486 6.66663 4.66667V2.66667Z" fill="currentColor"/>`,
      `<path d="M7.33329 6.66667C6.9651 6.66667 6.66663 6.96514 6.66663 7.33333V9.33333C6.66663 9.70152 6.9651 10 7.33329 10H10.6666C11.0348 10 11.3333 9.70152 11.3333 9.33333V7.33333C11.3333 6.96514 11.0348 6.66667 10.6666 6.66667H7.33329Z" fill="currentColor"/>`,
      `</svg>`,
      tableName,
    ].join('');

    insertChip(chip, sel, '@');
    setMentionQuery(null);
    setTimeout(() => handleInput(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // @ suggestion navigation
    if (mentionQuery !== null && suggestions.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); return; }
      if (e.key === 'Enter')     { e.preventDefault(); commitMention(suggestions[activeIdx]); return; }
      if (e.key === 'Escape')    { e.preventDefault(); setMentionQuery(null); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit(); }
  };

  const kbdStyle: React.CSSProperties = {
    fontFamily: 'inherit',
    background: systemColors.light['background-sunken'],
    border: `1px solid ${systemColors.light['border-divider']}`,
    borderRadius: 3, padding: '0px 4px',
    fontSize: 10, color: systemColors.light['content-primary'],
  };

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: 48 }}>
      {/* Simulated placeholder — shown only when editor is empty */}
      {isEmpty && (
        <div style={{
          position: 'absolute', top: 0, left: 0, pointerEvents: 'none',
          fontSize: 16, lineHeight: '24px', fontWeight: fontWeight.light,
          color: systemColors.light['content-secondary'],
          fontFamily: 'inherit', letterSpacing: '-0.064px',
        }}>
          {placeholder}
        </div>
      )}

      {/* Contenteditable — React does not reconcile its children */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={() => onFocusChange(true)}
        onBlur={() => { onFocusChange(false); setMentionQuery(null); }}
        style={{
          width: '100%', minHeight: 48, outline: 'none',
          fontSize: 16, lineHeight: '24px', fontWeight: fontWeight.light,
          color: systemColors.light['content-primary'],
          fontFamily: 'inherit', letterSpacing: '-0.064px',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}
      />

      {/* @ table suggestion dropdown */}
      {mentionQuery !== null && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', bottom: '100%', left: 0, right: 0, zIndex: 20,
          background: 'white', borderRadius: spacing.B, marginBottom: spacing.A,
          border: `1px solid ${systemColors.light['border-divider']}`,
          boxShadow: '0px 8px 16px rgba(25,35,49,0.08), 0px 0px 4px rgba(25,35,49,0.06)',
          overflow: 'hidden',
        }}>
          {/* Connection name strip */}
          {connectionName && (
            <div style={{
              padding: `5px 14px`, display: 'flex', alignItems: 'center', gap: spacing.B,
              backgroundColor: systemColors.light['background-sunken'],
              borderBottom: `1px solid ${systemColors.light['border-divider']}`,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0 }}>
                <path d="M12 2v20M12 2l-3 3M12 2l3 3M12 22l-3-3M12 22l3-3" stroke="#29B5E8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12h20M2 12l3-3M2 12l3 3M22 12l-3-3M22 12l-3 3" stroke="#29B5E8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5.636 5.636l12.728 12.728M5.636 5.636l1.06 3.889M5.636 5.636l3.889 1.06M18.364 18.364l-1.06-3.889M18.364 18.364l-3.889-1.06" stroke="#29B5E8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.364 5.636L5.636 18.364M18.364 5.636l-3.889 1.06M18.364 5.636l-1.06 3.889M5.636 18.364l3.889-1.06M5.636 18.364l1.06-3.889" stroke="#29B5E8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: 11, fontWeight: fontWeight.regular, lineHeight: '16px', color: systemColors.light['content-secondary'], letterSpacing: '0.2px' }}>
                {connectionName}
              </span>
            </div>
          )}
          {suggestions.map((t, i) => {
            const q  = mentionQuery.toLowerCase();
            const ms = t.toLowerCase().indexOf(q);
            return (
              <div
                key={t}
                onMouseDown={e => { e.preventDefault(); commitMention(t); }}
                onMouseEnter={() => setActiveIdx(i)}
                style={{
                  height: 36, padding: `0 14px`, display: 'flex', alignItems: 'center',
                  gap: spacing.B, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
                  background: i === activeIdx ? systemColors.light['background-sunken'] : 'white',
                  color: systemColors.light['content-primary'],
                }}
              >
                {/* Grid icon — GridViewIcon xs from @components/icons */}
                <span style={{ flexShrink: 0, display: 'inline-flex' }}>
                  <GridViewIcon size="xs" color={systemColors.light['content-brand']} aria-hidden />
                </span>
                {!q || ms === -1 ? t : (
                  <span>
                    {t.slice(0, ms)}
                    <strong style={{ color: systemColors.light['content-brand'], fontWeight: fontWeight.light }}>{t.slice(ms, ms + q.length)}</strong>
                    {t.slice(ms + q.length)}
                  </span>
                )}
              </div>
            );
          })}
          <div style={{ padding: `6px 14px`, borderTop: `1px solid ${systemColors.light['border-divider']}`, display: 'flex', alignItems: 'center', gap: spacing.B }}>
            {(['↵', '↑↓'] as const).map((k, i) => (
              <React.Fragment key={k}>
                <kbd style={kbdStyle}>{k}</kbd>
                <span style={{ fontSize: 11, color: systemColors.light['content-secondary'], marginRight: spacing.B }}>{['to add', 'to navigate'][i]}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

// ─── Direction data ────────────────────────────────────────────────────────────
// Direction interface is exported from DirectionCard.tsx — imported above.

const MOCK_DIRECTIONS: Direction[] = [
  {
    id: 'd1',
    title: 'Sales performance by region',
    description: 'Track revenue, quota attainment, and deal pipeline across all sales regions.',
    goal: 'Enable sales leaders to track revenue, quota attainment, and deal pipeline across regions — so they can identify top performers and make data-driven coaching decisions.',
    keyQuestions: [
      'What is total revenue by region this quarter vs last quarter?',
      'Which regions are behind on their quota targets?',
      'What is the average deal size and win rate by region?',
      'How has year-over-year revenue trended across territories?',
      'Which sales reps are consistently exceeding or missing quota?',
    ],
    linkedConcepts: ['deals', 'regions', 'sales_reps', 'quotas'],
    understoodPoints: [
      'Closed-won deal value is the primary revenue signal — not pipeline or forecast',
      'Performance is grouped by region, territory, and sales rep hierarchy',
      'Quarterly and year-over-year comparisons surface trends and seasonal patterns',
      'Quota attainment aligns deal value to annual targets prorated by fiscal quarter',
      'Consumers include VPs, regional managers, and RevOps — each needs different drill depth',
    ],
    addedSections: [
      {
        label: 'Consumers & personas',
        items: [
          'VP of Sales — quarterly board-level pipeline review, territory health at a glance',
          'Regional Sales Managers — weekly rep coaching, deal-level drill-down',
          'Revenue Operations — quota setting, forecast accuracy, data quality checks',
        ],
      },
      {
        label: 'Key metrics',
        items: [
          'Total Revenue (closed-won deal value)',
          'Quota Attainment (% of quota achieved per rep / region)',
          'Deal Count (number of closed-won deals)',
          'YoY Revenue Growth (current period vs same period last year)',
          'Average Deal Size',
          'Win Rate',
        ],
      },
      {
        label: 'Dimensions & filters',
        items: [
          'Region, territory, sub-region',
          'Sales rep, team, manager',
          'Deal stage, deal type, product line',
          'Close date, fiscal quarter, fiscal year',
        ],
      },
      {
        label: 'Time handling',
        items: [
          'Year-over-year and quarterly comparisons as the primary lens',
          'Fiscal calendar aligned — Q1 starts February, quota prorated accordingly',
          'MTD and QTD running totals for real-time tracking',
        ],
      },
      {
        label: 'AI instructions',
        items: [
          '"Revenue" defaults to closed-won deal value unless pipeline or forecast is specified',
          '"Quota" = annual sales target, prorated by quarter',
          '"Region" = primary sales territory assignment, not the customer\'s billing address',
        ],
      },
      {
        label: 'Limitations',
        items: [
          'Returns and refunds not yet modelled — revenue figures are gross',
          'Territory re-assignments before 2023 may cause historical rep-level figures to appear understated',
          'Forecast data is not included in this model',
        ],
      },
    ],
    guardrails: [
      'Exclude test accounts and internal dummy deals from all revenue calculations',
      'Do not expose cost, margin, or commission data — this model is for revenue tracking only',
      'Unattributed orders (no region_id) excluded from regional breakdowns but included in company-wide totals',
    ],
    docHtml: `
<h2>Goal</h2>
<p>Enable sales leaders and regional managers to track revenue, quota attainment, and deal pipeline across all regions — so they can identify top performers, surface underperforming territories, and make data-driven coaching decisions.</p>

<h2>Key business questions</h2>
<ul>
  <li>What is total revenue by region this quarter vs last quarter?</li>
  <li>Which regions are behind on their quota targets?</li>
  <li>What is the average deal size and win rate by region?</li>
  <li>How has YoY revenue trended across territories?</li>
  <li>Which sales reps are consistently exceeding or missing quota?</li>
</ul>

<h2>Consumers &amp; personas</h2>
<ul>
  <li><strong>VP of Sales</strong> — quarterly board-level pipeline review, territory health at a glance</li>
  <li><strong>Regional Sales Managers</strong> — weekly rep coaching, deal-level drill-down</li>
  <li><strong>Revenue Operations</strong> — quota setting, forecast accuracy, data quality checks</li>
</ul>

<h2>Key metrics</h2>
<ul>
  <li>Total Revenue (closed-won deal value)</li>
  <li>Quota Attainment (% of quota achieved per rep / region)</li>
  <li>Deal Count (number of closed-won deals)</li>
  <li>YoY Revenue Growth (current period vs same period last year)</li>
  <li>Average Deal Size</li>
  <li>Win Rate</li>
</ul>

<h2>Dimensions &amp; filters</h2>
<ul>
  <li>Region, territory, sub-region</li>
  <li>Sales rep, team, manager</li>
  <li>Deal stage, deal type, product line</li>
  <li>Close date, fiscal quarter, fiscal year</li>
</ul>

<h2>Time handling</h2>
<p>Year-over-year and quarterly comparisons as the primary lens. Support fiscal calendar alignment (Q1 starts February). Include MTD and QTD running totals for real-time tracking.</p>

<h2>Guardrails</h2>
<ul>
  <li>Exclude test accounts and internal dummy deals from all revenue calculations</li>
  <li>Do not expose cost, margin, or commission data — this model is for revenue tracking only</li>
  <li>Unattributed orders (no region_id) should be excluded from regional breakdowns but included in company-wide totals</li>
</ul>

<h2>AI instructions</h2>
<p>When a user asks about "revenue", default to closed-won deal value unless they specify pipeline or forecast. "Quota" refers to the annual sales target, prorated by quarter. "Region" means the primary sales territory assignment — not the customer's billing address.</p>

<h2>Limitations</h2>
<ul>
  <li>Returns and refunds are not yet modelled — revenue figures are gross</li>
  <li>Territory re-assignments before 2023 may cause historical rep-level figures to appear understated</li>
  <li>Forecast data is not included in this model</li>
</ul>`.trim(),
  },
  // ─── d2 kept in code for future use — uncomment to re-enable ───────────────
  /* {
    id: 'd2',
    title: 'Customer health and retention',
    description: 'Identify at-risk customers early by tracking engagement trends and support interactions.',
    goal: 'Give customer success teams a single view of customer health so they can proactively intervene before customers churn.',
    keyQuestions: [
      'Which customers have had low engagement over the last 30 days?',
      'What is the churn rate broken down by customer segment?',
      'How does support ticket volume correlate with churn risk?',
    ],
    docHtml: `
<h2>Goal</h2>
<p>Give customer success teams a single view of customer health — combining engagement signals, support history, and NPS scores — so they can proactively intervene before customers churn.</p>

<h2>Key business questions</h2>
<ul>
  <li>Which customers have had low engagement over the last 30 days?</li>
  <li>What is the churn rate broken down by customer segment?</li>
  <li>Which customer segments generate the most recurring revenue?</li>
  <li>How does support ticket volume correlate with churn risk?</li>
  <li>What is the NPS trend for at-risk customers vs healthy ones?</li>
</ul>

<h2>Consumers &amp; personas</h2>
<ul>
  <li><strong>Customer Success Managers</strong> — daily account health review, renewal risk identification</li>
  <li><strong>VP of Customer Success</strong> — portfolio-level churn forecasting, segment health</li>
  <li><strong>Product team</strong> — feature adoption signals, engagement depth analysis</li>
</ul>

<h2>Key metrics</h2>
<ul>
  <li>Churn Risk Score (composite — engagement + support + NPS)</li>
  <li>Last Active Date (most recent product session)</li>
  <li>Support Ticket Count (open + recent)</li>
  <li>NPS Score (latest survey response)</li>
  <li>Customer Lifetime Value (ARR × expected tenure)</li>
  <li>Days Since Last Login</li>
</ul>

<h2>Dimensions &amp; filters</h2>
<ul>
  <li>Customer segment (SMB, Mid-Market, Enterprise)</li>
  <li>CSM owner, account tier</li>
  <li>Product plan, contract type</li>
  <li>Renewal date, contract start date</li>
  <li>Health status (Healthy / At Risk / Critical)</li>
</ul>

<h2>Time handling</h2>
<p>Rolling 30/60/90-day windows for engagement metrics. Point-in-time snapshots for NPS and health score history. Renewal dates as forward-looking anchors for at-risk prioritisation.</p>

<h2>Guardrails</h2>
<ul>
  <li>Only include active customers (status = active) — exclude churned, suspended, and trial accounts</li>
  <li>Do not surface individual employee-level activity — aggregate at account level only</li>
  <li>Financial contract values should only be visible to CSM managers and above</li>
</ul>

<h2>AI instructions</h2>
<p>"Engagement" means product login activity and feature usage events — not email opens or marketing interactions. "At risk" means a churn risk score above 60. When asked about "customers", default to active accounts in the current book of business unless the user specifies a segment or time range.</p>

<h2>Limitations</h2>
<ul>
  <li>Mobile app engagement events are not yet ingested — engagement scores reflect web activity only</li>
  <li>NPS data has gaps for customers who opted out of surveys</li>
  <li>Historical churn risk scores before Q3 2023 are unavailable</li>
</ul>`.trim(),
    // d2 requires new fields (linkedConcepts, understoodPoints, addedSections, guardrails) before un-commenting
    linkedConcepts: [],
    understoodPoints: [],
    addedSections: [],
    guardrails: [],
  }, */
];


// ─── Revised direction — v2 MRD shown after the user requests an edit ─────────
// Simulates SpotterModel incorporating a "add product line breakdown" request.
const MOCK_DIRECTION_V2: Direction = {
  id: 'd1-v2',
  title: 'Sales performance by region & product',
  description: 'Track revenue, quota attainment, and pipeline across sales regions and product lines.',
  goal: 'Enable sales leaders to track revenue, quota attainment, and deal pipeline across regions and product lines — so they can identify growth opportunities by category and make data-driven coaching decisions.',
  keyQuestions: [
    'What is total revenue by region this quarter vs last quarter?',
    'Which regions are behind on their quota targets?',
    'Which product lines are driving the most revenue growth?',
    'What is the average deal size and win rate by region and product?',
    'What is the open pipeline value by region and product line?',
    'How has year-over-year revenue trended across territories?',
    'Which sales reps are consistently exceeding or missing quota?',
  ],
  linkedConcepts: ['deals', 'regions', 'sales_reps', 'quotas', 'products'],
  understoodPoints: [
    'Closed-won deal value is the primary revenue signal — not pipeline or forecast',
    'Performance is grouped by region, territory, sales rep hierarchy, and product line',
    'Quarterly and year-over-year comparisons surface trends and seasonal patterns',
    'Quota attainment aligns deal value to annual targets prorated by fiscal quarter',
    'Product line attribution uses the primary product on each deal',
    'Consumers include VPs, regional managers, RevOps, and product managers',
  ],
  addedSections: [
    {
      label: 'Consumers & personas',
      items: [
        'VP of Sales — board-level pipeline review, territory and product health at a glance',
        'Regional Sales Managers — weekly rep coaching, deal drill-down by product',
        'Revenue Operations — quota setting, forecast accuracy, product mix analysis',
        'Product Managers — product revenue contribution and attach rates',
      ],
    },
    {
      label: 'Key metrics',
      items: [
        'Total Revenue (closed-won deal value)',
        'Quota Attainment (% of quota achieved per rep / region)',
        'Pipeline Value (open opportunities weighted by stage)',
        'Average Sales Cycle Length (days from open to close)',
        'Product Attach Rate (% of deals including each product line)',
        'YoY Revenue Growth (current period vs same period last year)',
        'Average Deal Size',
        'Win Rate',
      ],
    },
    {
      label: 'Dimensions & filters',
      items: [
        'Region, territory, sub-region',
        'Sales rep, team, manager',
        'Product line, product category, product SKU',
        'Deal stage, deal type',
        'Close date, fiscal quarter, fiscal year',
      ],
    },
    {
      label: 'Time handling',
      items: [
        'Year-over-year and quarterly comparisons as the primary lens',
        'Fiscal calendar aligned — Q1 starts February, quota prorated accordingly',
        'MTD and QTD running totals for real-time tracking',
        'Pipeline snapshots taken at end of each fiscal quarter for trend analysis',
      ],
    },
    {
      label: 'AI instructions',
      items: [
        '"Revenue" defaults to closed-won deal value unless pipeline or forecast is specified',
        '"Quota" = annual sales target, prorated by quarter',
        '"Region" = primary sales territory assignment, not the customer\'s billing address',
        '"Product" refers to the primary product line on a deal — multi-product deals use the highest-value line',
      ],
    },
    {
      label: 'Limitations',
      items: [
        'Returns and refunds not yet modelled — revenue figures are gross',
        'Territory re-assignments before 2023 may cause historical rep-level figures to appear understated',
        'Pipeline metrics reflect current open opportunities — closed/lost pipeline is not backdated',
      ],
    },
  ],
  guardrails: [
    'Exclude test accounts and internal dummy deals from all revenue calculations',
    'Do not expose cost, margin, or commission data — this model is for revenue tracking only',
    'Unattributed orders (no region_id) excluded from regional breakdowns but included in company-wide totals',
    'Multi-product deals must not be double-counted — use primary product line for product attribution',
  ],
  docHtml: '',
};

// DirectionCard is now imported from ./DirectionCard

// ─── Requirements canvas panel ────────────────────────────────────────────────
// Full requirements doc for a direction. Slides in from the right.
// Sits alongside the chat column in a flex layout.

function RequirementsCanvas({
  direction,
  onClose,
  onUpdate,
}: {
  direction: Direction;
  onClose: () => void;
  onUpdate: (d: Direction) => void;
}) {
  const docRef     = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [toolbar, setToolbar] = useState<{ top: number; left: number } | null>(null);

  // Set initial HTML imperatively — dangerouslySetInnerHTML + contentEditable conflict in React
  useEffect(() => {
    if (docRef.current) {
      docRef.current.innerHTML = direction.docHtml;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectionChange = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !docRef.current?.contains(sel.anchorNode)) {
      setToolbar(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const rect  = range.getBoundingClientRect();
    const containerRect = docRef.current!.getBoundingClientRect();
    setToolbar({
      top:  rect.top - containerRect.top - 44,
      left: rect.left - containerRect.left + rect.width / 2,
    });
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [handleSelectionChange]);

  const execFmt = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    docRef.current?.focus();
  };

  return (
    <div style={{
      width: '55%', flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      borderLeft: `1px solid ${systemColors.light['border-divider']}`,
      backgroundColor: systemColors.light['background-base'],
      animation: 'slideInFromRight 0.25s cubic-bezier(0.4,0,0.2,1) both',
      overflow: 'hidden',
    }}>
      {/* Canvas header */}
      <div style={{
        height: 52, flexShrink: 0,
        display: 'flex', alignItems: 'center',
        padding: `0 ${spacing.D}px 0 ${spacing.F}px`,
        borderBottom: `1px solid ${systemColors.light['border-divider']}`,
        gap: spacing.C,
      }}>
        {/* Doc icon */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden style={{ flexShrink: 0, color: systemColors.light['content-secondary'] }}>
          <path d="M3 2h7l3 3v9H3V2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
          <path d="M10 2v3h3M6 7h4M6 10h4M6 13h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        {/* Title */}
        <span style={{ flex: 1, fontSize: fontSize.md, fontWeight: 600, color: systemColors.light['content-primary'], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {direction.title}
        </span>
        {/* Format toolbar buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, borderRight: `1px solid ${systemColors.light['border-divider']}`, paddingRight: spacing.C, marginRight: spacing.A }}>
          {[
            { label: 'B',  title: 'Bold',   cmd: 'bold',    style: { fontWeight: 700 } },
            { label: 'I',  title: 'Italic', cmd: 'italic',  style: { fontStyle: 'italic' } },
            { label: '•',  title: 'Bullet list', cmd: 'insertUnorderedList', style: {} },
          ].map(({ label, title, cmd, style }) => (
            <button
              key={cmd}
              title={title}
              onMouseDown={e => { e.preventDefault(); execFmt(cmd); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                width: 28, height: 28, borderRadius: 4,
                fontSize: 13, color: systemColors.light['content-secondary'],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'inherit', ...style,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = systemColors.light['background-sunken']; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
            >
              {label}
            </button>
          ))}
        </div>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            width: 28, height: 28, borderRadius: 4, padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: systemColors.light['content-secondary'],
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = systemColors.light['background-sunken']; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
          aria-label="Close canvas"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Floating selection toolbar */}
      {toolbar && (
        <div
          ref={toolbarRef}
          onMouseDown={e => e.preventDefault()}
          style={{
            position: 'absolute',
            top: toolbar.top,
            left: toolbar.left,
            transform: 'translateX(-50%)',
            zIndex: 20,
            display: 'flex', alignItems: 'center', gap: 2,
            background: systemColors.light['content-primary'],
            borderRadius: 6, padding: '4px 6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          }}
        >
          {[
            { label: 'B',  cmd: 'bold' },
            { label: 'I',  cmd: 'italic' },
            { label: 'H2', cmd: 'formatBlock', val: 'h2' },
            { label: '•',  cmd: 'insertUnorderedList' },
          ].map(({ label, cmd, val }) => (
            <button
              key={cmd}
              onMouseDown={e => { e.preventDefault(); execFmt(cmd, val); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'white', fontSize: 12, fontWeight: 600,
                padding: '2px 6px', borderRadius: 4,
                fontFamily: 'inherit', lineHeight: '18px',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.15)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Doc body */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        <div
          ref={docRef}
          contentEditable
          suppressContentEditableWarning
          onInput={() => { if (docRef.current) onUpdate({ ...direction, docHtml: docRef.current.innerHTML }); }}
          style={{
            outline: 'none',
            padding: `${spacing.F}px`,
            fontSize: 13,
            lineHeight: '20px',
            fontFamily: fontFamily.primary,
            color: systemColors.light['content-primary'],
            minHeight: '100%',
          }}
        />
      </div>
    </div>
  );
}



// ─── Build plan data ───────────────────────────────────────────────────────────

// PlanPhase: one of the 5 visual phases shown in the plan card
interface PlanPhase {
  planLabel: string;
  planCaption: string;      // 2-line caption — \n renders as line break (white-space: pre-line)
  reasoning: string;        // fallback single inline text (kept for backwards compat)
  reasoningHeader: string;  // header shown in the per-step ReasoningBlock while phase is active
  reasoningTexts: string[]; // 2-3 inline texts that cycle as micro-steps complete within the phase
  endStep: number;          // inclusive last micro-step index for this phase
}

// MicroStep: one per item reveal — drives completedCount increments
interface MicroStep {
  delayMs: number;
  phaseIndex: number;    // 0-4 which of the 5 phases this step belongs to
}

interface DirectionPlan {
  phases: PlanPhase[];   // exactly 5 entries
  steps: MicroStep[];    // one per item: 15 for d1, 13 for d2
}

const BUILD_PLAN: Record<string, DirectionPlan> = {
  d1: {
    phases: [
      {
        planLabel: 'Scanning connection',
        planCaption: 'Found 8 candidate tables in Snowflake\n4 match the sales performance context — 1 fact, 3 dimensions',
        reasoningHeader: 'Looking for matching tables',
        reasoning: 'Scanning the Snowflake schema for fact and dimension tables related to sales performance and regional revenue…',
        reasoningTexts: [
          'Scanning Snowflake for available tables…',
          'Filtering by sales performance context…',
          'Matching grain and dimension patterns…',
        ],
        endStep: 0,
      },
      {
        planLabel: 'Selecting tables',
        planCaption: 'Adding FACT_SALES_ORDERS as the primary grain table\nDIM_REGIONS, DIM_SALES_REPS, and DIM_DATE joined as dimensions',
        reasoningHeader: 'Adding tables to the model',
        reasoning: 'Identified fact_sales_orders as the primary grain (85K rows). Adding dimension tables for regions, sales reps, and calendar dates to enable full analytical coverage.',
        reasoningTexts: [
          'Evaluating fact tables by row count and keys…',
          'Adding regional dimension table…',
          'Adding sales rep dimension table…',
          'Adding date dimension for time-series support…',
        ],
        endStep: 4,
      },
      {
        planLabel: 'Building relationships',
        planCaption: '3 joins validated via region_id, rep_id, and order_date\nNo ambiguous paths or circular references detected',
        reasoningHeader: 'Defining table joins',
        reasoning: 'Joining dim_regions on region_id (INNER), dim_sales_reps on rep_id (LEFT to preserve unassigned orders), and dim_date on order_date (INNER) for time-series analysis.',
        reasoningTexts: [
          'Joining fact to region dimension on region_id…',
          'Joining fact to sales rep dimension on rep_id…',
          'Joining fact to date dimension on order_date…',
        ],
        endStep: 7,
      },
      {
        planLabel: 'Configuring columns & formulas',
        planCaption: '23 columns labeled with types, descriptions, and AI context\n4 metrics defined: Total Revenue, Quota Attainment, Deal Count, YoY Growth',
        reasoningHeader: 'Annotating columns and metrics',
        reasoning: 'Annotating all columns with AI-friendly context. Defining total_revenue (SUM), quota_attainment (ratio), deal_count (COUNT DISTINCT), and yoy_growth (LAG window) for full KPI coverage.',
        reasoningTexts: [
          'Labeling columns with data types and descriptions…',
          'Adding AI context to dimension attributes…',
          'Defining revenue and quota formulas…',
          'Validating formula syntax and coverage…',
        ],
        endStep: 11,
      },
      {
        planLabel: 'Making AI ready',
        planCaption: 'AI search context added to all 23 columns\n3 sample questions verified as answerable by the model',
        reasoningHeader: 'Enabling AI search context',
        reasoning: 'Applying region_id IS NOT NULL filter to exclude unattributed system rows. Generating sample questions to validate coverage and setting AI context for each column.',
        reasoningTexts: [
          'Applying data filters for clean AI results…',
          'Generating sample business questions…',
          'Verifying question answerability…',
        ],
        endStep: 14,
      },
    ],
    // 15 micro-steps: 1 scan + 4 tables + 3 rels + 4 formulas + 3 questions
    steps: [
      { phaseIndex: 0, delayMs: 1200 }, // scan
      { phaseIndex: 1, delayMs: 400 },  // table 1
      { phaseIndex: 1, delayMs: 400 },  // table 2
      { phaseIndex: 1, delayMs: 400 },  // table 3
      { phaseIndex: 1, delayMs: 400 },  // table 4
      { phaseIndex: 2, delayMs: 450 },  // rel 1
      { phaseIndex: 2, delayMs: 450 },  // rel 2
      { phaseIndex: 2, delayMs: 450 },  // rel 3
      { phaseIndex: 3, delayMs: 400 },  // formula 1
      { phaseIndex: 3, delayMs: 400 },  // formula 2
      { phaseIndex: 3, delayMs: 400 },  // formula 3
      { phaseIndex: 3, delayMs: 400 },  // formula 4
      { phaseIndex: 4, delayMs: 400 },  // question 1
      { phaseIndex: 4, delayMs: 400 },  // question 2
      { phaseIndex: 4, delayMs: 400 },  // question 3
    ],
  },
  d2: {
    phases: [
      {
        planLabel: 'Scanning connection',
        planCaption: 'Found 6 candidate tables in Redshift\n3 match the churn analysis context — 1 fact, 2 dimensions',
        reasoningHeader: 'Looking for matching tables',
        reasoning: 'Scanning the Redshift schema for customer activity, engagement, and support tables relevant to churn analysis…',
        reasoningTexts: [
          'Scanning Redshift for available tables…',
          'Filtering by churn analysis context…',
          'Matching customer activity patterns…',
        ],
        endStep: 0,
      },
      {
        planLabel: 'Selecting tables',
        planCaption: 'Adding FACT_CUSTOMER_ACTIVITY as the primary grain table\nDIM_CUSTOMERS and DIM_DATE joined as dimensions',
        reasoningHeader: 'Adding tables to the model',
        reasoning: 'Identified fact_customer_activity as the engagement grain (120K event rows). Adding dim_customers for account metadata and dim_date for time-windowed lookback analysis.',
        reasoningTexts: [
          'Evaluating customer activity tables by event volume…',
          'Adding customer profile dimension…',
          'Adding date dimension for lookback windows…',
        ],
        endStep: 3,
      },
      {
        planLabel: 'Building relationships',
        planCaption: '2 joins validated via customer_id and activity_date\nAll join paths verified — no missing foreign keys',
        reasoningHeader: 'Defining table joins',
        reasoning: 'Joining dim_customers on customer_id (INNER) for segment and tier breakdown, and dim_date on activity_date (INNER) to enable 30-day and 90-day lookback windows.',
        reasoningTexts: [
          'Joining fact to customer dimension on customer_id…',
          'Joining fact to date for 30/90-day lookback windows…',
        ],
        endStep: 5,
      },
      {
        planLabel: 'Configuring columns & formulas',
        planCaption: '18 columns labeled with types, descriptions, and AI context\n4 metrics: Last Active Date, Support Tickets, NPS Score, Churn Risk Score',
        reasoningHeader: 'Annotating columns and metrics',
        reasoning: 'Annotating all columns with churn-oriented AI context. Defining last_active_date (MAX), support_tickets (COUNT), nps_score (rolling AVG), and churn_risk_score (weighted composite).',
        reasoningTexts: [
          'Labeling columns with churn-oriented context…',
          'Adding AI context to engagement signals…',
          'Defining churn risk and NPS formulas…',
          'Validating composite metric weights…',
        ],
        endStep: 9,
      },
      {
        planLabel: 'Making AI ready',
        planCaption: 'AI search context added to all 18 columns\n3 sample questions verified as answerable by the model',
        reasoningHeader: 'Enabling AI search context',
        reasoning: 'Applying active customer filter (status = active) to exclude closed accounts. Generating sample questions to validate engagement and revenue coverage.',
        reasoningTexts: [
          'Applying active customer status filter…',
          'Generating sample engagement questions…',
          'Verifying churn prediction coverage…',
        ],
        endStep: 12,
      },
    ],
    // 13 micro-steps: 1 scan + 3 tables + 2 rels + 4 formulas + 3 questions
    steps: [
      { phaseIndex: 0, delayMs: 1200 }, // scan
      { phaseIndex: 1, delayMs: 450 },  // table 1
      { phaseIndex: 1, delayMs: 450 },  // table 2
      { phaseIndex: 1, delayMs: 450 },  // table 3
      { phaseIndex: 2, delayMs: 500 },  // rel 1
      { phaseIndex: 2, delayMs: 500 },  // rel 2
      { phaseIndex: 3, delayMs: 400 },  // formula 1
      { phaseIndex: 3, delayMs: 400 },  // formula 2
      { phaseIndex: 3, delayMs: 400 },  // formula 3
      { phaseIndex: 3, delayMs: 400 },  // formula 4
      { phaseIndex: 4, delayMs: 400 },  // question 1
      { phaseIndex: 4, delayMs: 400 },  // question 2
      { phaseIndex: 4, delayMs: 400 },  // question 3
    ],
  },
};

// ─── Model spec data — fed into window.__DME_AUTO_DATA__ for startAutoPopulate ──

type SqlDataType = 'VARCHAR' | 'BIGINT' | 'INTEGER' | 'DATE' | 'FLOAT';
type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
type Cardinality = 'N:1' | '1:N' | '1:1' | 'N:N';

interface ModelColumnDef {
  name: string;
  dataType: SqlDataType;
  type: 'Dimension' | 'Metric';
  description: string;
  aiCtx: string;
}

interface ModelTableDef {
  tableName: string;
  tableType: 'Fact' | 'Dimension';
  rowCount: string;
  columns: ModelColumnDef[];
}

interface ModelRelationshipDef {
  leftTable: string;
  leftKey: string;
  rightTable: string;
  rightKey: string;
  joinType: JoinType;
  cardinality: Cardinality;
}

interface ModelFormulaDef {
  name: string;
  expression: string;
  outputType: 'Metric' | 'Dimension';
  baseTable: string;
  description: string;
}

interface ModelSpec {
  tables:        ModelTableDef[];
  relationships: ModelRelationshipDef[];
  formulas:      ModelFormulaDef[];
}

const MODEL_SPEC: Record<string, ModelSpec> = {
  d1: {
    tables: [
      {
        tableName: 'FACT_SALES_ORDERS',
        tableType: 'Fact',
        rowCount:  '85K rows',
        columns: [
          { name: 'order_id',     dataType: 'VARCHAR', type: 'Dimension', description: 'Unique order identifier. Primary key.',                        aiCtx: 'Unique identifier for each sales order' },
          { name: 'order_date',   dataType: 'DATE',    type: 'Dimension', description: 'Date the order was placed, normalised to YYYY-MM-DD.',         aiCtx: 'Date the order was placed' },
          { name: 'order_amount', dataType: 'BIGINT',  type: 'Metric',    description: 'Raw order value in USD at time of purchase.',                  aiCtx: 'Total revenue value of the order in USD' },
          { name: 'order_status', dataType: 'VARCHAR', type: 'Dimension', description: 'Order status: won, lost, pending.',                            aiCtx: 'Current status of the order — won, lost, or pending' },
          { name: 'region_id',    dataType: 'VARCHAR', type: 'Dimension', description: 'Join key → dim_regions. Use region_name for display.',         aiCtx: 'Sales region where the order originated' },
          { name: 'rep_id',       dataType: 'VARCHAR', type: 'Dimension', description: 'Join key → dim_sales_reps. Use rep_name for display.',         aiCtx: 'Sales representative who owns the order' },
        ],
      },
      {
        tableName: 'DIM_REGIONS',
        tableType: 'Dimension',
        rowCount:  '12 rows',
        columns: [
          { name: 'region_id',   dataType: 'VARCHAR', type: 'Dimension', description: 'Primary key.',                                                  aiCtx: 'Unique region identifier' },
          { name: 'region_name', dataType: 'VARCHAR', type: 'Dimension', description: 'Human-readable region label. Use for grouping and chart labels.',aiCtx: 'Human-readable name for the sales region' },
          { name: 'territory',   dataType: 'VARCHAR', type: 'Dimension', description: 'Aggregated territory grouping: AMER, EMEA, APAC.',              aiCtx: 'Broad territory grouping (AMER, EMEA, APAC)' },
        ],
      },
      {
        tableName: 'DIM_SALES_REPS',
        tableType: 'Dimension',
        rowCount:  '48 rows',
        columns: [
          { name: 'rep_id',       dataType: 'VARCHAR', type: 'Dimension', description: 'Primary key.',                 aiCtx: 'Unique identifier for the sales representative' },
          { name: 'rep_name',     dataType: 'VARCHAR', type: 'Dimension', description: 'Full name of the sales rep.',  aiCtx: 'Full name of the sales representative' },
          { name: 'quota_target', dataType: 'BIGINT',  type: 'Metric',    description: 'Annual quota in USD.',         aiCtx: 'Annual sales quota assigned to the rep in USD' },
        ],
      },
      {
        tableName: 'DIM_DATE',
        tableType: 'Dimension',
        rowCount:  '1,826 rows',
        columns: [
          { name: 'date_key', dataType: 'DATE',    type: 'Dimension', description: 'Primary key in YYYYMMDD format. Join on order_date.', aiCtx: 'Calendar date key for time-based joins' },
          { name: 'quarter',  dataType: 'VARCHAR', type: 'Dimension', description: 'Quarter label (Q1–Q4). Use for QoQ analysis.',        aiCtx: 'Fiscal quarter label for quarterly comparisons' },
          { name: 'year',     dataType: 'INTEGER', type: 'Dimension', description: 'Calendar year. Use for year-over-year comparisons.',  aiCtx: 'Calendar year for year-over-year analysis' },
          { name: 'month',    dataType: 'VARCHAR', type: 'Dimension', description: 'Month name. Use for monthly trend views.',            aiCtx: 'Month name for monthly trend analysis' },
        ],
      },
    ],
    relationships: [
      { leftTable: 'fact_sales_orders', leftKey: 'region_id',  rightTable: 'dim_regions',    rightKey: 'region_id', joinType: 'INNER', cardinality: 'N:1' },
      { leftTable: 'fact_sales_orders', leftKey: 'rep_id',     rightTable: 'dim_sales_reps', rightKey: 'rep_id',    joinType: 'LEFT',  cardinality: 'N:1' },
      { leftTable: 'fact_sales_orders', leftKey: 'order_date', rightTable: 'dim_date',       rightKey: 'date_key',  joinType: 'INNER', cardinality: 'N:1' },
    ],
    formulas: [
      { name: 'total_revenue',    expression: 'SUM(order_amount)',                                                    outputType: 'Metric', baseTable: 'fact_sales_orders', description: 'Sum of order_amount in USD. Primary revenue metric.' },
      { name: 'quota_attainment', expression: 'total_revenue / quota_target',                                         outputType: 'Metric', baseTable: 'fact_sales_orders', description: "Revenue as a ratio of the rep's annual quota target." },
      { name: 'deal_count',       expression: 'COUNT(DISTINCT order_id)',                                             outputType: 'Metric', baseTable: 'fact_sales_orders', description: 'Count of distinct closed deals per rep or region.' },
      { name: 'yoy_growth',       expression: '(curr_quarter_rev - prev_year_quarter_rev)\n/ prev_year_quarter_rev', outputType: 'Metric', baseTable: 'fact_sales_orders', description: 'Year-over-year revenue growth using a LAG window partitioned by region.' },
    ],
  },
  d2: {
    tables: [
      {
        tableName: 'FACT_CUSTOMER_ACTIVITY',
        tableType: 'Fact',
        rowCount:  '120K rows',
        columns: [
          { name: 'activity_id',   dataType: 'VARCHAR', type: 'Dimension', description: 'Unique event identifier. Primary key.',          aiCtx: 'Unique identifier for each customer activity event' },
          { name: 'customer_id',   dataType: 'VARCHAR', type: 'Dimension', description: 'Join key → dim_customers.',                     aiCtx: 'Customer who performed the activity' },
          { name: 'activity_date', dataType: 'DATE',    type: 'Dimension', description: 'Date of the customer activity event.',           aiCtx: 'Date the activity occurred' },
          { name: 'activity_type', dataType: 'VARCHAR', type: 'Dimension', description: 'Type of activity: login, feature_use, support.', aiCtx: 'Type of engagement event (login, feature use, support)' },
        ],
      },
      {
        tableName: 'DIM_CUSTOMERS',
        tableType: 'Dimension',
        rowCount:  '4,200 rows',
        columns: [
          { name: 'customer_id',    dataType: 'VARCHAR', type: 'Dimension', description: 'Primary key.',                                     aiCtx: 'Unique customer account identifier' },
          { name: 'customer_name',  dataType: 'VARCHAR', type: 'Dimension', description: 'Account name. Use for display in dashboards.',     aiCtx: 'Account display name for dashboards and reports' },
          { name: 'segment',        dataType: 'VARCHAR', type: 'Dimension', description: 'Segment: Enterprise, Mid-Market, SMB.',            aiCtx: 'Customer size segment (Enterprise, Mid-Market, SMB)' },
          { name: 'tier',           dataType: 'VARCHAR', type: 'Dimension', description: 'Subscription tier: Platinum, Gold, Silver.',       aiCtx: 'Subscription tier (Platinum, Gold, Silver)' },
          { name: 'contract_value', dataType: 'BIGINT',  type: 'Metric',    description: 'Annual contract value in USD.',                    aiCtx: 'Annual contract value in USD' },
        ],
      },
      {
        tableName: 'DIM_DATE',
        tableType: 'Dimension',
        rowCount:  '1,826 rows',
        columns: [
          { name: 'date_key', dataType: 'DATE',    type: 'Dimension', description: 'Primary key. Join on activity_date.',               aiCtx: 'Calendar date key for time-based joins' },
          { name: 'month',    dataType: 'VARCHAR', type: 'Dimension', description: 'Month name. Use for monthly trend views.',           aiCtx: 'Month name for monthly trend analysis' },
          { name: 'quarter',  dataType: 'VARCHAR', type: 'Dimension', description: 'Quarter label. Use for QoQ analysis.',              aiCtx: 'Quarter label for quarterly comparisons' },
        ],
      },
    ],
    relationships: [
      { leftTable: 'fact_customer_activity', leftKey: 'customer_id',   rightTable: 'dim_customers', rightKey: 'customer_id', joinType: 'INNER', cardinality: 'N:1' },
      { leftTable: 'fact_customer_activity', leftKey: 'activity_date', rightTable: 'dim_date',      rightKey: 'date_key',   joinType: 'INNER', cardinality: 'N:1' },
    ],
    formulas: [
      { name: 'last_active_date',  expression: 'MAX(activity_date)',                                                   outputType: 'Dimension', baseTable: 'fact_customer_activity', description: 'Most recent activity date per customer. Signals recency.' },
      { name: 'support_tickets',   expression: "COUNT(activity_id)\nWHERE activity_type = 'support'",                 outputType: 'Metric',    baseTable: 'fact_customer_activity', description: 'Count of support tickets. Elevated values flag at-risk accounts.' },
      { name: 'nps_score',         expression: 'AVG(nps_value)\nOVER (RANGE 60 PRECEDING)',                           outputType: 'Metric',    baseTable: 'fact_customer_activity', description: 'Rolling 60-day NPS average. A drop >10 pts flags churn risk.' },
      { name: 'churn_risk_score',  expression: '(0.4 * recency_score)\n+ (0.35 * ticket_trend)\n+ (0.25 * nps_drop)', outputType: 'Metric',    baseTable: 'fact_customer_activity', description: 'Weighted health score 0–100. 40% recency · 35% tickets · 25% NPS.' },
    ],
  },
};

// ── Agent avatar row — used in the chat stream for reasoning + response messages ─
function AgentRow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing.C, paddingLeft: spacing.C }}>
      <img
        src="/spotter-assets/SpotterModel avatar.svg"
        width={32} height={32} alt="SpotterModel"
        style={{ flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0, paddingTop: spacing.A }}>{children}</div>
    </div>
  );
}
const AGENT_TEXT_INDENT = spacing.C + 32 + spacing.C + spacing.A; // 60 px

// ─── Clarifying questions data ────────────────────────────────────────────────

const CLARIFYING_QUESTIONS: ClarifyQuestion[] = [
  {
    question: "What's the main business outcome this model should support?",
    options: [
      { label: 'Track and analyse sales performance' },
      { label: 'Monitor customer retention and churn' },
      { label: 'Understand product engagement' },
      { label: 'Operational reporting' },
    ],
  },
  {
    question: 'Who are the primary consumers of this model?',
    options: [
      { label: 'Sales and revenue teams' },
      { label: 'Customer success managers' },
      { label: 'Product and data teams' },
      { label: 'Executive stakeholders' },
    ],
  },
  {
    question: 'How should time be handled in this model?',
    options: [
      { label: 'Year-over-year and quarterly comparisons' },
      { label: 'Rolling 30/60/90-day windows' },
      { label: 'Month-to-date and quarter-to-date' },
      { label: 'Point-in-time snapshots' },
    ],
  },
];

// ─── Chat message types ────────────────────────────────────────────────────────

type ChatMsg =
  | { kind: 'user';       id: string; text: string; html?: string }
  | { kind: 'reasoning';  id: string; data: ReasoningData; responseText?: string }
  | { kind: 'directions'; id: string; version: number; isCollapsed: boolean };

type ChatPhase =
  | 'reasoning_initial'   // first reasoning block; bottom = locked input
  | 'clarifying'          // ClarifyingCard occupies bottom slot
  | 'reasoning_post'      // second reasoning block; bottom = locked input
  | 'directions'          // MRD shown; prompt bar active for revisions
  | 'reasoning_revision'  // revision reasoning block; bottom = locked input
  | 'idle'                // chat on screen; prompt bar at bottom for follow-up
  | 'skip_clarify'        // all questions skipped — reasoning + agent response
  | 'skip_idle';          // prompt bar active after skip response

// ─── User message row ─────────────────────────────────────────────────────────
// Avatar + text inside the sunken card, with spacing.C (12 px) padding all around.
// AgentRow matches this left padding so both avatars share the same x-position.

function UserMsgRow({ text, html }: { text: string; html?: string }) {
  const textStyle: React.CSSProperties = {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.light,
    lineHeight: '22px',
    color: systemColors.light['content-primary'],
    whiteSpace: 'pre-wrap',
    paddingTop: spacing.A,
  };
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: spacing.C,
      backgroundColor: systemColors.light['background-sunken'],
      borderRadius: spacing.C,
      padding: spacing.C,
    }}>
      <img
        src="/spotter-assets/User avatar.png"
        width={32} height={32} alt="User"
        style={{ borderRadius: '50%', flexShrink: 0 }}
      />
      {html ? (
        <div style={textStyle} dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <div style={textStyle}>{text}</div>
      )}
    </div>
  );
}


// ─── Main component ────────────────────────────────────────────────────────────

export interface ModelOnboardingScreenProps {
  connection: DataConnection;
  onBuild: () => void;
  onSkip: () => void;
  onExit: () => void;
  /** Re-opens the connection selection screen so the user can switch connections. */
  onChangeConnection?: () => void;
}

export const ModelOnboardingScreen: React.FC<ModelOnboardingScreenProps> = ({
  connection,
  onBuild,
  onSkip,
  onExit,
  onChangeConnection,
}) => {
  const connectionName = connection.name;
  const [showConnDetails, setShowConnDetails] = useState(false);

  // ── Demo variant + screen state ──────────────────────────────────────────

  // ── Screen state machine ──────────────────────────────────────────────────
  type ScreenState = 'prompt' | 'chat';
  const [screenState,       setScreenState]       = useState<ScreenState>('prompt');
  const [currentPromptText, setCurrentPromptText] = useState('');
  const [lastPrompt,        setLastPrompt]         = useState('');

  // ── Chat state ────────────────────────────────────────────────────────────
  // Start idle — effect fires only when handleBuild/handleFollowUp
  // explicitly transitions into 'reasoning_initial'.
  const [chatPhase,      setChatPhase]      = useState<ChatPhase>('idle');
  const [clarifyStep,    setClarifyStep]    = useState(0);
  const [clarifyAnswers, setClarifyAnswers] = useState<Array<{ selections: string[]; freeText?: string }>>([]);
  const [chatMessages,     setChatMessages]     = useState<ChatMsg[]>([]);
  const [directions,        setDirections]        = useState<Direction[]>(MOCK_DIRECTIONS);
  const [canvasDirection,   setCanvasDirection]   = useState<Direction | null>(null);
  const [currentPromptHtml, setCurrentPromptHtml] = useState('');
  const [manualLinkHovered, setManualLinkHovered] = useState(false);

  const chatScrollRef    = useRef<HTMLDivElement>(null);
  const lastUserRef      = useRef<HTMLDivElement>(null);
  const reasoningMsgId   = useRef<string>('');
  const shouldScrollNext = useRef(false);

  const SUBTITLE = "I'll build an AI-ready model for you in minutes";

  // Auto-scroll: fires once on user send, then once more on the first agent
  // response. All subsequent message additions in the same response chain are
  // suppressed so the user can freely scroll without being pulled away.
  useEffect(() => {
    if (!chatMessages.length) return;
    const lastMsg = chatMessages[chatMessages.length - 1];

    const doScroll = () => {
      const el = lastUserRef.current;
      const container = chatScrollRef.current;
      if (!el || !container) return;
      const elRect = el.getBoundingClientRect();
      const cRect  = container.getBoundingClientRect();
      container.scrollTo({ top: Math.max(0, container.scrollTop + (elRect.top - cRect.top) - 12), behavior: 'smooth' });
    };

    if (lastMsg.kind === 'user') {
      shouldScrollNext.current = true;
      doScroll();
      return;
    }

    if (shouldScrollNext.current) {
      shouldScrollNext.current = false;
      doScroll();
      return;
    }

    // Suppress auto-scroll for all further messages in the same response chain
  }, [chatMessages.length]);

  // ── Reasoning helpers ─────────────────────────────────────────────────────

  const updateReasoningMsg = useCallback(
    (id: string, patch: Partial<Omit<Extract<ChatMsg, { kind: 'reasoning' }>, 'kind' | 'id'>>) => {
      setChatMessages(prev => prev.map(m =>
        m.id === id && m.kind === 'reasoning' ? { ...m, ...patch } : m
      ));
    }, []);

  // Kick off the initial reasoning sequence once we enter 'reasoning_initial'
  useEffect(() => {
    if (chatPhase !== 'reasoning_initial') return;

    const msgId = `r-initial-${Date.now()}`;
    reasoningMsgId.current = msgId;

    const inProgress: ReasoningData = {
      header: 'Understanding your use case', isDone: false,
      inlineText: 'Analysing your use case…',
      steps: [],
    };
    setChatMessages(prev => [...prev, { kind: 'reasoning', id: msgId, data: inProgress }]);

    const t1 = setTimeout(() => updateReasoningMsg(msgId, {
      data: { ...inProgress, inlineText: 'Mapping business context…' },
    }), 1800);

    const t2 = setTimeout(() => updateReasoningMsg(msgId, {
      data: { ...inProgress, inlineText: 'Identifying what I need to know…' },
    }), 3400);

    // t3: mark reasoning done + show response text
    const t3 = setTimeout(() => {
      updateReasoningMsg(msgId, {
        data: {
          header: 'Done', isDone: true, inlineText: '',
          steps: [
            { n: 1, name: 'Parsed prompt',      text: 'Extracted business context and key entities.',          dotState: 'done' },
            { n: 2, name: 'Checked schema',     text: 'Scanned connection for candidate tables.',              dotState: 'done' },
            { n: 3, name: 'Prepared questions', text: 'Identified 3 clarifying questions to refine scope.',   dotState: 'done' },
          ],
        },
        responseText: "Got it — before I start building, I have a few quick questions.",
      });
    }, 5000);

    // t4: show clarifying card ~400 ms after the response text, so the user
    // has a moment to read it before the card slides in from the bottom.
    const t4 = setTimeout(() => setChatPhase('clarifying'), 5400);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatPhase]);

  // Kick off the post-clarify reasoning sequence
  useEffect(() => {
    if (chatPhase !== 'reasoning_post') return;

    const msgId = `r-post-${Date.now()}`;
    reasoningMsgId.current = msgId;

    const inProgress: ReasoningData = {
      header: 'Connecting the dots', isDone: false,
      inlineText: 'Mapping your answers to business entities…',
      steps: [],
    };
    setChatMessages(prev => [...prev, { kind: 'reasoning', id: msgId, data: inProgress }]);

    const t1 = setTimeout(() => updateReasoningMsg(msgId, {
      data: { ...inProgress, inlineText: 'Structuring the model requirements…' },
    }), 1600);

    const t2 = setTimeout(() => updateReasoningMsg(msgId, {
      data: { ...inProgress, inlineText: 'Preparing model requirements…' },
    }), 3000);

    const t3 = setTimeout(() => {
      updateReasoningMsg(msgId, {
        data: {
          header: 'Done', isDone: true, inlineText: '',
          steps: [
            { n: 1, name: 'Mapped context',       text: 'Matched goals and audience to schema entities.',  dotState: 'done' },
            { n: 2, name: 'Selected tables',      text: 'Found 4 candidate tables for your model.',       dotState: 'done' },
            { n: 3, name: 'Prepared requirements', text: 'Generated a Model Requirements Document.',      dotState: 'done' },
          ],
        },
      });
      setChatMessages(prev => [...prev, { kind: 'directions', id: `dir-${Date.now()}`, version: 1, isCollapsed: false }]);
      setChatPhase('directions');
    }, 4800);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatPhase]);

  // Skip-clarify flow — user answered nothing across all three questions
  useEffect(() => {
    if (chatPhase !== 'skip_clarify') return;

    const msgId = `r-skip-${Date.now()}`;
    reasoningMsgId.current = msgId;

    const inProgress: ReasoningData = {
      header: 'Reviewing your prompt', isDone: false,
      inlineText: 'Working with the context from your initial prompt…',
      steps: [],
    };
    setChatMessages(prev => [...prev, { kind: 'reasoning', id: msgId, data: inProgress }]);

    const t1 = setTimeout(() => {
      updateReasoningMsg(msgId, {
        data: {
          header: 'Done', isDone: true, inlineText: '',
          steps: [
            { n: 1, name: 'Read initial prompt', text: 'Extracted business context from your use case description.', dotState: 'done' },
          ],
        },
        responseText: "No problem — I can draft a Model Requirements Document (MRD) based on your initial prompt alone. If you'd like to add more context first, type it below. Otherwise, just say 'Start building MRD' and I'll get going.",
      });
    }, 1200);

    const t2 = setTimeout(() => setChatPhase('skip_idle'), 1600);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatPhase]);

  // Kick off the revision reasoning sequence
  useEffect(() => {
    if (chatPhase !== 'reasoning_revision') return;

    const msgId = `r-revision-${Date.now()}`;
    reasoningMsgId.current = msgId;

    const inProgress: ReasoningData = {
      header: 'Revisiting the requirements', isDone: false,
      inlineText: 'Reviewing your changes…',
      steps: [],
    };
    setChatMessages(prev => [...prev, { kind: 'reasoning', id: msgId, data: inProgress }]);

    const t1 = setTimeout(() => updateReasoningMsg(msgId, {
      data: { ...inProgress, inlineText: 'Applying updates to the requirements…' },
    }), 1400);

    const t2 = setTimeout(() => {
      updateReasoningMsg(msgId, {
        data: {
          header: 'Done', isDone: true, inlineText: '',
          steps: [
            { n: 1, name: 'Parsed changes',      text: 'Identified the requested modifications.',          dotState: 'done' },
            { n: 2, name: 'Updated requirements', text: 'Revised goals, questions, and schema mappings.', dotState: 'done' },
          ],
        },
        responseText: "Switched focus to churn analysis — updated the primary grain, metric set, and sample questions.\nReview the Goals and Formulas sections — the calculated metrics and audience definition have changed.",
      });
    }, 2800);

    // ~400 ms after response text appears: collapse old MRDs, push new one
    const t3 = setTimeout(() => {
      setChatMessages(prev => {
        // Derive next version from existing direction messages
        const maxVersion = prev
          .filter((m): m is Extract<ChatMsg, { kind: 'directions' }> => m.kind === 'directions')
          .reduce((max, m) => Math.max(max, m.version), 0);
        const newVersion = maxVersion + 1;

        const withCollapsed = prev.map(m =>
          m.kind === 'directions' ? { ...m, isCollapsed: true } : m
        );
        return [...withCollapsed, {
          kind: 'directions' as const,
          id: `dir-${Date.now()}`,
          version: newVersion,
          isCollapsed: false,
        }];
      });
      setChatPhase('directions');
    }, 3200);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatPhase]);

  // ── Action handlers ───────────────────────────────────────────────────────

  const handleBuild = () => {
    if (!currentPromptText.trim()) return;
    const text = currentPromptText.trim();
    const html = currentPromptHtml || undefined;
    setLastPrompt(text);
    setChatMessages([{ kind: 'user', id: `u-${Date.now()}`, text, html }]);
    setChatPhase('reasoning_initial');
    setClarifyStep(0);
    setClarifyAnswers([]);
    setDirections(MOCK_DIRECTIONS);
    setCurrentPromptText('');
    setCurrentPromptHtml('');
    setScreenState('chat');
  };

  const handleClarifyNext = (selections: string[], freeText?: string) => {
    const newAnswers = [...clarifyAnswers, { selections, freeText }];
    setClarifyAnswers(newAnswers);

    if (clarifyStep < CLARIFYING_QUESTIONS.length - 1) {
      // Advance card in-place — no bubble yet
      setClarifyStep(s => s + 1);
    } else {
      const allSkipped = newAnswers.every(a => a.selections.length === 0 && !a.freeText);

      if (allSkipped) {
        // User skipped all questions — skip flow instead of Q&A summary
        setChatMessages(prev => [
          ...prev,
          { kind: 'user', id: `u-${Date.now()}`, text: 'I skipped the clarifying questions' },
        ]);
        setChatPhase('skip_clarify');
      } else {
        // At least one question answered — format combined Q: A: bubble
        const summary = newAnswers.map((ans, i) => {
          const q = CLARIFYING_QUESTIONS[i].question;
          const a = [...ans.selections, ...(ans.freeText ? [ans.freeText] : [])].join(', ');
          return `Q: ${q}\nA: ${a}`;
        }).join('\n\n');

        setChatMessages(prev => [
          ...prev,
          { kind: 'user', id: `u-${Date.now()}`, text: summary },
        ]);
        setChatPhase('reasoning_post');
      }
    }
  };

  const handleClarifyCancel = () => {
    // Stay on chat screen; show prompt bar for follow-up
    setChatPhase('idle');
  };

  const handleFollowUp = () => {
    if (!currentPromptText.trim()) return;
    const text = currentPromptText.trim();
    const html = currentPromptHtml || undefined;
    setChatMessages(prev => [...prev, { kind: 'user', id: `u-${Date.now()}`, text, html }]);
    setClarifyAnswers([]);
    setClarifyStep(0);
    setCurrentPromptText('');
    setCurrentPromptHtml('');
    // After a skip, treat any follow-up as additional context and go straight to MRD generation.
    // If MRD is already shown treat as revision; otherwise re-run initial reasoning.
    if (chatPhase === 'skip_idle') {
      setChatPhase('reasoning_post');
    } else {
      setChatPhase(chatPhase === 'directions' ? 'reasoning_revision' : 'reasoning_initial');
    }
  };

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column',
        background: systemColors.light['background-base'],
        width: '100%', height: '100vh', overflow: 'hidden',
        fontFamily: fontFamily.primary, color: systemColors.light['content-primary'],
      }}
    >
      {/* Keyframes */}
      <style>{`
        @property --gradient-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes rotate-border { to { --gradient-angle: 360deg; } }
        @keyframes gradientSweepStatic {
          0%   { background-position: 100% 0; }
          55%  { background-position: 50% 0; }
          100% { background-position: 0% 0; }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.75); }
        }
        @keyframes slideUpIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideInFromRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        textarea::placeholder { color: ${systemColors.light['content-secondary']}; }
        /* Direction card doc typography */
        [contenteditable] h2 {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: var(--rd-sys-color-content-secondary);
          margin: 20px 0 6px;
          padding: 0;
        }
        [contenteditable] h2:first-child {
          margin-top: 0;
        }
        [contenteditable] p {
          margin: 0 0 4px;
          font-size: 13px;
          line-height: 20px;
          color: var(--rd-sys-color-content-primary);
        }
        [contenteditable] ul {
          margin: 0 0 4px;
          padding-left: 18px;
        }
        [contenteditable] li {
          font-size: 13px;
          line-height: 20px;
          color: var(--rd-sys-color-content-primary);
          margin-bottom: 2px;
        }
        [contenteditable] strong {
          font-weight: 600;
          color: var(--rd-sys-color-content-primary);
        }
      `}</style>

      {/* ── Top header ── */}
      <div style={{
        height: 60, flexShrink: 0,
        display: 'flex', alignItems: 'center',
        padding: `0 ${spacing.E}px`,
        borderBottom: `1px solid ${systemColors.light['border-divider']}`,
        backgroundColor: systemColors.light['background-base'],
        gap: spacing.B,
      }}>
        <span style={{ fontSize: 20, fontWeight: 500, color: systemColors.light['content-primary'], whiteSpace: 'nowrap', flexShrink: 0 }}>
          Data model editor
        </span>
      </div>

      {/* ── Prompt screen ── */}
      {screenState === 'prompt' && (
        <>
          <main style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflowY: 'auto',
            padding: `${spacing.H}px ${spacing.F}px`,
          }}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              width: '100%', maxWidth: 791,
              animation: 'slideUpIn 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: spacing.F }}>
                {/* Hero */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: spacing.C }}>
                  <AgentAvatar />
                  <h2 style={{
                    fontSize: 32, lineHeight: '40px', fontWeight: 600,
                    letterSpacing: '-0.128px', color: systemColors.light['content-primary'],
                    textAlign: 'center', margin: 0,
                  }}>
                    Hi! I&apos;m <GradText>SpotterModel</GradText>
                  </h2>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <p style={{
                      fontSize: 18, lineHeight: '24px', fontWeight: 600,
                      margin: 0, color: systemColors.light['content-primary'],
                    }}>
                      {SUBTITLE}
                    </p>
                  </div>
                </div>
                {/* Prompt bar + hint */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 760, gap: spacing.C }}>
                  <PromptBar
                    onTextChange={setCurrentPromptText}
                    onHtmlChange={setCurrentPromptHtml}
                    onSubmit={handleBuild}
                    connectionName={connectionName}
                    onConnectionClick={() => onChangeConnection?.()}
                    onShowConnectionDetails={() => setShowConnDetails(true)}
                    initialText={lastPrompt || undefined}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.B }}>
                    <SparkleIcon />
                    <span style={{ fontSize: 14, lineHeight: '20px', fontWeight: fontWeight.light, color: systemColors.light['content-secondary'] }}>
                      Type <span style={{ color: systemColors.light['content-primary'] }}>@</span> to reference tables from the connection
                    </span>
                  </div>
                  <button
                    onClick={onSkip}
                    onMouseEnter={() => setManualLinkHovered(true)}
                    onMouseLeave={() => setManualLinkHovered(false)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      display: 'flex', alignItems: 'center', gap: spacing.B,
                      fontSize: 15, lineHeight: '22px',
                      marginTop: spacing.I,
                    }}
                  >
                    <span style={{ fontWeight: fontWeight.light, color: systemColors.light['content-secondary'] }}>or</span>
                    <span style={{ fontWeight: 500, color: systemColors.light['content-primary'], textDecoration: manualLinkHovered ? 'underline' : 'none' }}>Continue building manually</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <p style={{
              position: 'absolute', bottom: spacing.B, fontSize: 14,
              lineHeight: '20px', fontWeight: fontWeight.light,
              color: systemColors.light['content-secondary'], textAlign: 'center',
            }}>
              SpotterModel responses should be reviewed.{' '}
              <Link href="#">Learn more</Link>
            </p>
          </main>

          {/* Footer — only on prompt screen */}
          <footer style={{
            height: 72, flexShrink: 0, /* no exact spacing token */
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            padding: `0 ${spacing.F}px`,
            backgroundColor: systemColors.light['background-sunken'],
            borderTop: `6px solid ${systemColors.light['content-brand']}`,
          }}>
            <Button variant="primary" onClick={onExit}>
              Exit data model
            </Button>
          </footer>
        </>
      )}

      {/* ── Chat screen ── */}
      {screenState === 'chat' && (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Chat column */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            {/* Scrollable messages area */}
            <div ref={chatScrollRef} style={{
              flex: 1, overflowY: 'auto',
              padding: `${spacing.F}px`,
              paddingBottom: spacing.J,
            }}>
              <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: spacing.D }}>
                {(() => {
                  const lastUserIdx = chatMessages.reduce((acc, m, i) => m.kind === 'user' ? i : acc, -1);
                  return chatMessages.map((msg, idx) => {
                  if (msg.kind === 'user') {
                    return (
                      <div key={msg.id} ref={idx === lastUserIdx ? lastUserRef : undefined}>
                        <UserMsgRow text={msg.text} html={msg.html} />
                      </div>
                    );
                  }

                  if (msg.kind === 'reasoning') {
                    return (
                      <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: spacing.B }}>
                        <AgentRow>
                          <ReasoningBlock data={msg.data} />
                        </AgentRow>
                        {msg.responseText && msg.data.isDone && (
                          <div style={{
                            paddingLeft: AGENT_TEXT_INDENT,
                            fontSize: fontSize.sm, fontWeight: fontWeight.light,
                            lineHeight: '22px', color: systemColors.light['content-primary'],
                            animation: 'fadeIn 0.3s ease both',
                            whiteSpace: 'pre-line',
                          }}>
                            {msg.responseText}
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (msg.kind === 'directions') {
                    // v2+ uses the revised direction; v1 uses the original
                    const mrd = msg.version > 1 ? MOCK_DIRECTION_V2 : directions[0];
                    const dirMsgs = chatMessages
                      .filter((m): m is Extract<ChatMsg, { kind: 'directions' }> => m.kind === 'directions');
                    const isLatest = dirMsgs[dirMsgs.length - 1]?.id === msg.id;
                    return (
                      <div key={msg.id} style={{
                        display: 'flex', flexDirection: 'column', gap: spacing.D,
                        animation: 'slideUpIn 0.35s cubic-bezier(0.4,0,0.2,1) both',
                      }}>
                        {/* Intro text only for v1 — revisions have responseText on the reasoning msg */}
                        {msg.version === 1 && (
                          <div style={{ paddingLeft: AGENT_TEXT_INDENT }}>
                            <p style={{ margin: 0, fontSize: fontSize.sm, fontWeight: fontWeight.light, lineHeight: '22px', color: systemColors.light['content-primary'] }}>
                              Based on your goals, I've prepared a Model Requirements Document. Review what I've drafted — when you're ready, click <strong>Build model</strong> to get started.
                            </p>
                          </div>
                        )}
                        {/* MRD card — indented to align with response text */}
                        {mrd && (
                          <div style={{ paddingLeft: AGENT_TEXT_INDENT }}>
                            <DirectionCard
                              direction={mrd}
                              connection={connection}
                              version={msg.version}
                              isCollapsed={msg.isCollapsed}
                              isLatest={isLatest}
                              onBuild={() => {
                                const spec       = MODEL_SPEC[mrd.id] ?? MODEL_SPEC['d1'];
                                const planPhases = BUILD_PLAN[mrd.id]?.phases ?? BUILD_PLAN['d1'].phases;
                                (window as any).__DME_AUTO_DATA__ = {
                                  goal:          mrd.goal,
                                  phases:        planPhases,
                                  tables:        spec.tables,
                                  relationships: spec.relationships,
                                  formulas:      spec.formulas,
                                };
                                (window as any).__DME_CONFIG__ = {
                                  spotterModel:   true,
                                  welcomeVariant: 'blank',
                                  autoPopulate:   true,
                                  modelName:      mrd.title,
                                  modelDesc:      mrd.description,
                                };
                                // Carry the full onboarding conversation into the DME AgentPanel.
                                // AgentPanel reads this window global on mount and pre-populates its
                                // message list so the user sees their history in the right panel.
                                // Build history: merge reasoning+directions pairs into a single
                                // 'mrd' entry so they appear as one AgentMessage in the DME panel.
                                (window as any).__ONBOARDING_HISTORY__ = chatMessages.reduce(
                                  (acc: unknown[], m, i, arr) => {
                                    if (m.kind === 'user') {
                                      acc.push({ kind: 'user', id: m.id, text: m.text, html: m.html });
                                      return acc;
                                    }
                                    if (m.kind === 'reasoning') {
                                      // If the next message is a directions card, defer — it will be
                                      // merged into the mrd entry below.
                                      const next = arr[i + 1];
                                      if (next?.kind === 'directions') return acc;
                                      // Standalone reasoning (e.g. initial reasoning before clarify)
                                      acc.push({
                                        kind: 'agent', id: m.id,
                                        reasoning: m.data,
                                        response: m.responseText
                                          ? { text: m.responseText, isVisible: true }
                                          : null,
                                      });
                                      return acc;
                                    }
                                    if (m.kind === 'directions') {
                                      const prev = arr[i - 1];
                                      // Merge the preceding reasoning message in if present
                                      const reasoningData = prev?.kind === 'reasoning' ? prev.data    : undefined;
                                      const responseText  = prev?.kind === 'reasoning' ? prev.responseText : undefined;
                                      acc.push({
                                        kind: 'mrd', id: m.id,
                                        mrdData: {
                                          direction: m.version > 1 ? MOCK_DIRECTION_V2 : MOCK_DIRECTIONS[0],
                                          connection: connection,
                                        },
                                        version:      m.version,
                                        isCollapsed:  true, // always collapsed in DME panel
                                        reasoning:    reasoningData,
                                        responseText: responseText,
                                      });
                                      return acc;
                                    }
                                    return acc;
                                  },
                                  []
                                );
                                onBuild();
                              }}
                              onToggleCollapse={() => setChatMessages(prev =>
                                prev.map(m =>
                                  m.id === msg.id && m.kind === 'directions'
                                    ? { ...m, isCollapsed: !m.isCollapsed }
                                    : m
                                )
                              )}
                              onOpenCanvas={() => setCanvasDirection(mrd)}
                            />
                          </div>
                        )}
                      </div>
                    );
                  }

                  return null;
                  });
                })()}
                {/* Spacer so the last message can scroll to the top of the view */}
                <div style={{ height: '60vh', flexShrink: 0 }} />
              </div>
            </div>

            {/* Bottom slot — ClarifyingCard or PromptBar */}
            <div style={{
              flexShrink: 0,
              backgroundColor: systemColors.light['background-base'],
              minHeight: 162,
            }}>
              <div style={{ padding: `${spacing.D}px ${spacing.F}px` }}>
                <div style={{ maxWidth: 760, margin: '0 auto' }}>
                  {chatPhase === 'clarifying' ? (
                    <ClarifyingCard
                      questions={CLARIFYING_QUESTIONS}
                      currentStep={clarifyStep}
                      onNext={handleClarifyNext}
                      onCancel={handleClarifyCancel}
                      onBack={() => {
                        setClarifyStep(s => Math.max(0, s - 1));
                        setClarifyAnswers(prev => prev.slice(0, -1));
                      }}
                    />
                  ) : (
                    /* PromptBar is always visible. Only the send button is disabled
                       while SpotterModel is reasoning — the user can still type. */
                    <PromptBar
                      onTextChange={setCurrentPromptText}
                      onHtmlChange={setCurrentPromptHtml}
                      onSubmit={handleFollowUp}
                      submitDisabled={chatPhase === 'reasoning_initial' || chatPhase === 'reasoning_post' || chatPhase === 'skip_clarify'}
                      initialText={currentPromptText || undefined}
                      connectionName={connectionName}
                      onConnectionClick={() => onChangeConnection?.()}
                      onShowConnectionDetails={() => setShowConnDetails(true)}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Disclaimer — below prompt bar */}
            <p style={{
              margin: 0, flexShrink: 0, textAlign: 'center',
              padding: `0 ${spacing.F}px ${spacing.B}px`,
              fontSize: 13, lineHeight: '20px', fontWeight: fontWeight.light,
              color: systemColors.light['content-secondary'],
              backgroundColor: systemColors.light['background-base'],
            }}>
              SpotterModel responses should be reviewed.{' '}
              <Link href="#">Learn more</Link>
            </p>

            {/* Footer — chat state */}
            <footer style={{
              height: 72, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: `0 ${spacing.F}px`,
              backgroundColor: systemColors.light['background-sunken'],
              borderTop: `6px solid ${systemColors.light['content-brand']}`,
            }}>
              <Button variant="secondary" onClick={onSkip}>
                Continue building manually
              </Button>
              <Button variant="primary" onClick={onExit}>
                Exit data model
              </Button>
            </footer>
          </div>

          {/* Requirements canvas — slides in when a direction doc is opened */}
          {canvasDirection && (
            <RequirementsCanvas
              direction={canvasDirection}
              onClose={() => setCanvasDirection(null)}
              onUpdate={updated => {
                setDirections(ds => ds.map(x => x.id === updated.id ? updated : x));
                setCanvasDirection(updated);
              }}
            />
          )}
        </div>
      )}

      {/* ── Connection details overlay ── */}
      {showConnDetails && (
        <div
          style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(29,35,47,0.80)', zIndex: 100 }}
          onClick={e => { if (e.target === e.currentTarget) setShowConnDetails(false); }}
        >
          <div style={{ width: 480, background: systemColors.light['background-base'], borderRadius: 6, boxShadow: '0 24px 32px rgba(29,35,47,0.16)', display: 'flex', flexDirection: 'column', fontFamily: fontFamily.primary }}>
            <div style={{ padding: `${spacing.F}px 28px ${spacing.D}px`, borderBottom: `1px solid ${systemColors.light['border-divider']}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: systemColors.light['content-primary'], margin: 0, letterSpacing: '-0.072px' }}>{connection.name}</h3>
                <span style={{ fontSize: 13, color: systemColors.light['content-secondary'] }}>Modified: {connection.modified}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.D }}>
                <span style={{ fontSize: 12, color: systemColors.light['content-secondary'] }}>Source: <strong style={{ fontWeight: 500 }}>{connection.source}</strong></span>
                <span style={{ fontSize: 12, color: systemColors.light['content-secondary'] }}>Created: {connection.created}</span>
              </div>
            </div>
            <div style={{ padding: `${spacing.D}px 28px ${spacing.F}px`, display: 'flex', flexDirection: 'column', gap: spacing.D }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: systemColors.light['content-primary'], margin: `0 0 6px` }}>Description</p>
                <p style={{ fontSize: 14, lineHeight: '20px', color: systemColors.light['content-primary'], fontWeight: fontWeight.light, margin: 0 }}>{connection.desc}</p>
              </div>
              <div style={{ height: 1, background: systemColors.light['border-divider'] }} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: systemColors.light['content-primary'], margin: `0 0 ${spacing.B}px` }}>Tags</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.B }}>
                  {connection.tags.map(tag => (
                    <span key={tag} style={{ fontSize: 13, color: systemColors.light['content-secondary'], background: systemColors.light['background-sunken'], padding: '3px 10px', borderRadius: spacing.A }}>{tag}</span>
                  ))}
                </div>
              </div>
              <div style={{ height: 1, background: systemColors.light['border-divider'] }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: systemColors.light['content-primary'], margin: `0 0 ${spacing.A}px` }}>Tables</p>
                  <p style={{ fontSize: 14, color: systemColors.light['content-primary'], margin: 0 }}>{connection.tables} tables</p>
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: systemColors.light['content-primary'], margin: `0 0 ${spacing.A}px` }}>Author</p>
                  <p style={{ fontSize: 14, color: systemColors.light['content-secondary'], margin: 0 }}>{connection.author}</p>
                </div>
              </div>
            </div>
            <div style={{ padding: `0 28px`, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', borderTop: `1px solid ${systemColors.light['border-divider']}`, background: systemColors.light['background-sunken'], borderRadius: '0 0 6px 6px' }}>
              <Button variant="primary" onClick={() => setShowConnDetails(false)}>Done</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelOnboardingScreen;
