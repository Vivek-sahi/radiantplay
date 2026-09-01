import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import type { RefObject } from 'react';
import { Icon } from '@components/icons';
import { Modal } from '@components/Modal';
import { Toggle } from '@components/Toggle';
import { FileCard, type UserMessageFile } from './UserMessage';
import { useSquirclePath } from './useSquirclePath';
import styles from './PromptBar.module.css';
import attachIcon from '../assets/Attach.svg';
import skillsIcon from '../assets/skills.svg';
import connectorsIcon from '../assets/connectors.svg';
import deepAnalysisIcon from '../assets/deep analysis.svg';
import googleDriveIcon from '../assets/google drive.png';

// ── Types ─────────────────────────────────────────────────────────────────────

export type OpenMenu = 'none' | 'plus' | 'model' | 'connectors';
type MenuDirection = 'down' | 'up';

const LINE_HEIGHT = 24; // px — matches .textarea line-height
const MAX_LINES = 7;
const TOP_PAD = 16; // px — textarea top inset (scrolls away so text bleeds to top)

interface PromptBarCoreProps {
  /** Whether the bar renders in focused/selected style */
  focused?: boolean;
  /** Which dropdown menu is open */
  openMenu?: OpenMenu;
  onOpenMenuChange?: (m: OpenMenu) => void;
  /** Whether deep analysis is active (chip visible) */
  deepAnalysis?: boolean;
  onDeepAnalysisChange?: (v: boolean) => void;
  /** Force hover on the deep analysis chip */
  chipHovered?: boolean;
  /** Typed text (controlled). Omit onValueChange to render read-only (spec). */
  value?: string;
  onValueChange?: (v: string) => void;
  onFocus?: () => void;
  onSend?: () => void;
  /** A response is generating — primary button shows Stop instead of Send. */
  generating?: boolean;
  onStop?: () => void;
  /** Minimum content height in lines (landing = 2, asked = 1). */
  minLines?: number;
  /** Which way menus open. */
  menuDirection?: MenuDirection;
  /** A specific data model is selected (shows its name). */
  modelSelected?: boolean;
  /** The selected model's name. */
  modelName?: string;
  /** Force the hover appearance (spec/control override). */
  forceHover?: boolean;
  /** Called when the model button is clicked with no model selected. */
  onOpenModelModal?: () => void;
  /** Where connectors live: inside the + menu, or a button beside the send arrow. */
  connectorsPlacement?: ConnectorsPlacement;
  /** A file-pulling MCP (Google Drive) is connected — shows it in the + menu. */
  googleDrive?: boolean;
  /** Skills feature enabled — shows it in the + menu. */
  skills?: boolean;
  /** "View data model instructions" available in the model menu. */
  instructions?: boolean;
  /** Highlighted/quoted context shown above the input (truncated to 1 line). */
  highlightedText?: string;
  onRemoveHighlight?: () => void;
  /** Attached files shown as cards below the input (max 10). */
  files?: UserMessageFile[];
  onRemoveFile?: (index: number) => void;
}

export type ConnectorsPlacement = 'menu' | 'right';

// Deep-analysis glyph drawn inline so it inherits the current text colour
// (the imported SVG asset has a fixed grey fill and can't be re-tinted).
function DeepAnalysisGlyph({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M11.0494 4.95456C7.88502 1.79016 3.95439 0.590287 2.27011 2.27456C1.07213 3.47255 1.33327 5.80698 2.72261 8.19382M4.95011 11.0539C8.11451 14.2183 12.0451 15.4181 13.7294 13.7339C14.9203 12.543 14.6693 10.2292 13.3016 7.85722"
        stroke="currentColor"
        strokeWidth="1.77778"
      />
      <path
        d="M13.852 2.14462C14.4592 2.75188 14.6829 3.92183 14.1717 5.5966C13.6732 7.22943 12.5275 9.11484 10.8191 10.8232C9.11064 12.5317 7.22471 13.678 5.59179 14.1765C3.91716 14.6876 2.74773 14.4633 2.1405 13.8561C1.53329 13.2488 1.30895 12.0794 1.82009 10.4048C2.31856 8.77186 3.46483 6.88594 5.17332 5.17744C6.88172 3.4691 8.76715 2.32338 10.4 1.8249C12.0747 1.31366 13.2447 1.53737 13.852 2.14462Z"
        stroke="currentColor"
        strokeWidth="1.77778"
      />
      <circle cx="8.00005" cy="8.00005" r="1.54839" fill="currentColor" />
    </svg>
  );
}

// Connectors glyph drawn inline so it inherits the current text colour
// (the imported SVG asset has a fixed grey fill and can't be re-tinted).
function ConnectorsGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.66639 2.6665C1.68415 2.6665 0.888916 3.46284 0.888916 4.44428V13.3332C0.888916 14.315 1.68486 15.1109 2.66669 15.1109H11.5556C12.5374 15.1109 13.3334 14.315 13.3334 13.3332V7.99984H8.00003V2.6665H2.66639ZM6.22225 7.99984V4.44428H2.66639L2.66651 7.99984H6.22225ZM2.66657 9.77762H6.22225V13.3332H2.66669L2.66657 9.77762ZM8.00003 9.77762H11.5556V13.3332H8.00003V9.77762Z"
        fill="currentColor"
      />
      <path
        d="M10.6662 1.77729V5.33285H14.2218V1.77729H10.6662ZM16 7.11111H8.88892V0H14.2218C15.2034 0 15.9998 0.795679 16 1.77729V7.11111Z"
        fill="currentColor"
      />
    </svg>
  );
}

// Stop glyph — a solid rounded square replacing the send arrow while generating.
function StopGlyph({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <rect width="10" height="10" rx="2" fill="currentColor" />
    </svg>
  );
}

// Follow-up glyph (the quote/reply arrow on the highlighted-text pill).
function FollowUpGlyph({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4.5 3v3.5a2 2 0 0 0 2 2h5.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 6l3 2.5-3 2.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


// ── Connectors ────────────────────────────────────────────────────────────────
//
// Each connector has a logo, name, and either an on/off toggle (already
// connected) or a "Connect" link (not yet connected). Up to 6 are shown inline;
// beyond that an "All connectors" entry is appended.

type ConnectorStatus = 'on' | 'off' | 'connect';

interface Connector {
  id: string;
  name: string;
  status: ConnectorStatus;
  color: string; // placeholder logo background until real logos are added
}

const CONNECTORS: Connector[] = [
  { id: 'gworkspace', name: 'Google Workspace', status: 'on', color: '#4285F4' },
  { id: 'onedrive', name: 'OneDrive', status: 'off', color: '#0078D4' },
  { id: 'canva', name: 'Canva', status: 'connect', color: '#7D2AE8' },
  { id: 'salesforce', name: 'Salesforce', status: 'on', color: '#00A1E0' },
  { id: 'slack', name: 'Slack', status: 'off', color: '#611F69' },
  { id: 'notion', name: 'Notion', status: 'connect', color: '#111827' },
  { id: 'dropbox', name: 'Dropbox', status: 'off', color: '#0061FF' },
  { id: 'figma', name: 'Figma', status: 'connect', color: '#A259FF' },
];

const MAX_VISIBLE_CONNECTORS = 6;

function ConnectorsMenu() {
  const [connectors, setConnectors] = useState(CONNECTORS);
  const visible = connectors.slice(0, MAX_VISIBLE_CONNECTORS);
  const hasMore = connectors.length > MAX_VISIBLE_CONNECTORS;

  // Clicking anywhere on a row does its action: a connected connector toggles
  // on/off; an unconnected one ("Connect") connects and turns on.
  const handleRow = (c: Connector) =>
    setConnectors((cs) =>
      cs.map((x) =>
        x.id === c.id
          ? { ...x, status: x.status === 'on' ? 'off' : 'on' }
          : x
      )
    );

  return (
    <div className={styles.menu}>
      <div className={styles.menuList}>
        {visible.map((c) => (
          <button className={styles.connectorRow} key={c.id} onClick={() => handleRow(c)}>
            <span className={styles.connectorLogo} style={{ background: c.color }}>
              {c.name.charAt(0)}
            </span>
            <span className={styles.menuItemLabel}>{c.name}</span>
            <span className={styles.connectorControl}>
              {c.status === 'connect' ? (
                <span className={styles.connectLink}>Connect</span>
              ) : (
                <Toggle checked={c.status === 'on'} showLabel={false} label={c.name} />
              )}
            </span>
          </button>
        ))}
        {hasMore && (
          <>
            <div className={styles.menuDivider} />
            <button className={styles.menuItem}>
              <span className={styles.menuItemLabel}>All connectors</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Plus menu ─────────────────────────────────────────────────────────────────

function PlusMenu({
  deepOn,
  onDeepToggle,
  googleDrive,
  skills,
  showConnectors,
}: {
  deepOn: boolean;
  onDeepToggle: () => void;
  googleDrive: boolean;
  skills: boolean;
  showConnectors: boolean;
}) {
  const [connectorsOpen, setConnectorsOpen] = useState(false);
  const [connectorsUp, setConnectorsUp] = useState(false);
  const submenuRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openConnectors = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setConnectorsOpen(true);
  };

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => {
      setConnectorsOpen(false);
      setConnectorsUp(false);
    }, 150);
  };

  // Flip the submenu to open upward when opening downward would overflow the
  // bottom of the viewport (e.g. the + menu sits near the bottom in asked mode).
  useLayoutEffect(() => {
    if (!connectorsOpen) return;
    const el = submenuRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setConnectorsUp(r.bottom > window.innerHeight - 8);
  }, [connectorsOpen]);

  return (
    <div className={styles.menu}>
      <div className={styles.menuList}>
        {/* Group 1 — file sources */}
        <button className={styles.menuItem}>
          <span className={styles.menuItemIcon}>
            <img src={attachIcon} alt="" width={16} height={16} />
          </span>
          <span className={styles.menuItemLabel}>Add files or photos</span>
        </button>
        {googleDrive && (
          <button className={styles.menuItem}>
            <span className={styles.menuItemIcon}>
              <img src={googleDriveIcon} alt="" width={16} height={16} />
            </span>
            <span className={styles.menuItemLabel}>Google Drive</span>
          </button>
        )}

        {/* Divider once the menu has 3+ items (base = Add files + Deep Analysis),
           i.e. when any of Google Drive / Connectors / Skills is present. */}
        {(googleDrive || showConnectors || skills) && <div className={styles.menuDivider} />}

        {/* Group 2 — capabilities */}
        {showConnectors && (
          <div
            className={`${styles.menuItem} ${styles.menuItemHasSub}`}
            onMouseEnter={openConnectors}
            onMouseLeave={scheduleClose}
          >
            <span className={styles.menuItemIcon}>
              <img src={connectorsIcon} alt="" width={16} height={16} />
            </span>
            <span className={styles.menuItemLabel}>Connectors</span>
            <span className={styles.menuItemChevron}>
              <Icon name="chevron-right" size="s" />
            </span>
            {connectorsOpen && (
              <div
                ref={submenuRef}
                className={`${styles.submenu} ${connectorsUp ? styles.submenuUp : ''}`}
                onMouseEnter={openConnectors}
                onMouseLeave={scheduleClose}
              >
                <ConnectorsMenu />
              </div>
            )}
          </div>
        )}
        {skills && (
          <button className={styles.menuItem}>
            <span className={styles.menuItemIcon}>
              <img src={skillsIcon} alt="" width={16} height={16} />
            </span>
            <span className={styles.menuItemLabel}>Skills</span>
            <span className={styles.menuItemChevron}>
              <Icon name="chevron-right" size="s" />
            </span>
          </button>
        )}
        <button className={styles.menuItem} onClick={() => onDeepToggle()}>
          <span className={styles.menuItemIcon}>
            <img src={deepAnalysisIcon} alt="" width={16} height={16} />
          </span>
          <span className={styles.menuItemLabel}>Deep Analysis</span>
          <span className={styles.connectorControl}>
            <Toggle checked={deepOn} onChange={() => {}} showLabel={false} label="Deep analysis" />
          </span>
        </button>
      </div>
    </div>
  );
}

// ── Model picker menu ─────────────────────────────────────────────────────────

function ModelMenu({ instructions }: { instructions: boolean }) {
  return (
    <div className={styles.menu}>
      <div className={styles.menuList}>
        <button className={styles.menuItem}>
          <span className={styles.menuItemLabel}>Change data model</span>
        </button>
        {/* Divider only when the instructions item is present (3 items). */}
        {instructions && <div className={styles.menuDivider} />}
        {instructions && (
          <button className={styles.menuItem}>
            <span className={styles.menuItemLabel}>View data model instructions</span>
          </button>
        )}
        <button className={styles.menuItem}>
          <span className={styles.menuItemLabel}>Preview data</span>
        </button>
      </div>
    </div>
  );
}

// ── Core bar ──────────────────────────────────────────────────────────────────

function PromptBarCore({
  focused = false,
  openMenu = 'none',
  onOpenMenuChange,
  deepAnalysis = false,
  onDeepAnalysisChange,
  chipHovered = false,
  value = '',
  onValueChange,
  onFocus,
  onSend,
  generating = false,
  onStop,
  minLines = 1,
  menuDirection = 'down',
  modelSelected = false,
  modelName = 'Mixpanel Daily Events',
  forceHover = false,
  onOpenModelModal,
  connectorsPlacement = 'menu',
  googleDrive = false,
  skills = false,
  instructions = true,
  highlightedText,
  onRemoveHighlight,
  files = [],
  onRemoveFile,
}: PromptBarCoreProps) {
  const [internalChipHovered, setInternalChipHovered] = useState(false);
  const isChipHovered = chipHovered || internalChipHovered;

  // When deep analysis is turned off (chip unmounts before onMouseLeave fires),
  // clear the hover flag so the cross isn't pre-shown when it turns back on.
  useEffect(() => {
    if (!deepAnalysis) setInternalChipHovered(false);
  }, [deepAnalysis]);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Squircle (smoothed corners) for the highlighted-context pill.
  const { ref: highlightRef, clipPath: highlightClip } = useSquirclePath({
    cornerRadius: 6,
    cornerSmoothing: 0.6,
  });

  // Responsive degradation as the bar narrows, keeping a 24px gap between the
  // left and right action clusters:
  //   1. Shrink the selected model name's max-width (168 → MODEL_MIN).
  //   2. If the name is already at its floor and still short on room, collapse
  //      the deep-analysis chip to icon-only.
  // The collapsed chip always reserves the cross's slot so hover never shifts UI.
  const actionsRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const chipTextRef = useRef<HTMLSpanElement>(null);
  const chipExtraRef = useRef(0); // px the chip label adds vs. the collapsed chip
  const [chipCompact, setChipCompact] = useState(false);
  const [modelMaxWidth, setModelMaxWidth] = useState(168);
  const MIN_ACTION_GAP = 24;
  const MODEL_MAX = 168;
  const MODEL_MIN = 56;

  useLayoutEffect(() => {
    const actions = actionsRef.current;
    const left = leftRef.current;
    const right = rightRef.current;
    if (!actions || !left || !right) return;

    const measure = () => {
      if (!chipCompact && chipTextRef.current) {
        chipExtraRef.current = chipTextRef.current.offsetWidth + 6; // text + chip gap
      }
      const label = labelRef.current;
      const labelW = label?.offsetWidth ?? 0;
      // scrollWidth = the name's full (untruncated) width, stable regardless of max-width.
      const labelNatural = label?.scrollWidth ?? 0;
      // Space available for the model label (label excluded from leftRest so it's stable).
      const leftRest = left.scrollWidth - labelW;
      const avail = actions.clientWidth - right.scrollWidth - MIN_ACTION_GAP - leftRest;
      const desired = Math.min(MODEL_MAX, labelNatural); // width the name wants

      // Priority 1: drop the deep-analysis chip's text (icon-only) before touching the name.
      if (deepAnalysis && !chipCompact && avail < desired) {
        setChipCompact(true);
        setModelMaxWidth(MODEL_MAX);
        return;
      }
      // Re-expand the chip text once there's room for both it and the full name.
      if (deepAnalysis && chipCompact && avail - chipExtraRef.current >= desired) {
        setChipCompact(false);
        setModelMaxWidth(MODEL_MAX);
        return;
      }

      // Priority 2: chip is in its final state — now shrink the name only if still tight.
      const targetMax =
        !modelSelected || avail >= desired ? MODEL_MAX : Math.max(MODEL_MIN, avail);
      setModelMaxWidth((prev) => (prev === targetMax ? prev : targetMax));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(actions);
    return () => ro.disconnect();
  }, [chipCompact, deepAnalysis, modelSelected, modelName, connectorsPlacement, value]);

  const isFocused = focused || openMenu !== 'none';

  const barClass = [
    styles.bar,
    isFocused ? styles.barFocused : '',
    forceHover && !isFocused ? styles.barHover : '',
  ]
    .filter(Boolean)
    .join(' ');

  const popoverClass = [
    styles.menuPopover,
    menuDirection === 'up' ? styles.menuPopoverUp : '',
  ]
    .filter(Boolean)
    .join(' ');

  const toggle = (menu: OpenMenu) =>
    onOpenMenuChange?.(openMenu === menu ? 'none' : menu);

  // When a highlight pill sits above the input, the bar supplies the top inset,
  // so the textarea drops its scroll-away top padding. (Files sit below the text.)
  const hasTopContent = !!highlightedText;
  const topPad = hasTopContent ? 0 : TOP_PAD;
  const minH = minLines * LINE_HEIGHT + topPad;
  const maxH = LINE_HEIGHT * MAX_LINES + topPad;

  // Auto-grow the textarea up to MAX_LINES, then it scrolls internally.
  useLayoutEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const next = Math.min(el.scrollHeight, maxH);
    el.style.height = `${Math.max(next, minH)}px`;
  }, [value, minLines, topPad, minH, maxH]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) onSend?.();
    }
  };

  return (
    <div className={barClass} style={{ paddingTop: hasTopContent ? 16 : 0 }}>
      {/* Highlighted context pill (above the input, 12px gap from the bar layout) */}
      {highlightedText && (
        <div ref={highlightRef} className={styles.highlightBar} style={{ clipPath: highlightClip }}>
          <span className={styles.highlightIcon}>
            <FollowUpGlyph size={14} />
          </span>
          <span className={styles.highlightText}>{highlightedText}</span>
          <button
            className={styles.highlightRemove}
            onClick={onRemoveHighlight}
            aria-label="Remove highlighted context"
          >
            <Icon name="cross" size="s" />
          </button>
        </div>
      )}

      {/* Text row */}
      <div className={styles.textRow}>
        <textarea
          ref={taRef}
          className={styles.textarea}
          value={value}
          placeholder="Press '/' for skills and '@' to add context"
          rows={minLines}
          readOnly={!onValueChange}
          onChange={(e) => onValueChange?.(e.target.value)}
          onFocus={onFocus}
          onKeyDown={handleKeyDown}
          style={{ paddingTop: topPad, minHeight: minH, maxHeight: maxH }}
        />
      </div>

      {/* Attached files — below the text */}
      {files.length > 0 && (
        <div className={styles.fileGrid}>
          {files.slice(0, 10).map((file, i) => (
            <FileCard key={i} file={file} onRemove={onRemoveFile ? () => onRemoveFile(i) : undefined} />
          ))}
        </div>
      )}

      {/* Action row */}
      <div className={styles.actions} ref={actionsRef}>
        <div className={styles.leftActions} ref={leftRef}>
          {/* Plus button + its menu, anchored to the button */}
          <div className={styles.menuAnchor}>
            <button
              className={`${styles.plusBtn} ${openMenu === 'plus' ? styles.plusBtnActive : ''}`}
              onClick={() => toggle('plus')}
              aria-label="Add context"
              aria-expanded={openMenu === 'plus'}
            >
              <Icon name="plus" size="m" />
            </button>
            {openMenu === 'plus' && (
              <div className={popoverClass}>
                <PlusMenu
                  deepOn={deepAnalysis}
                  onDeepToggle={() => onDeepAnalysisChange?.(!deepAnalysis)}
                  googleDrive={googleDrive}
                  skills={skills}
                  showConnectors={connectorsPlacement === 'menu'}
                />
              </div>
            )}
          </div>

          {/* Model picker button + its menu, anchored to the button */}
          <div className={styles.menuAnchor}>
            <button
              className={`${styles.modelBtn} ${openMenu === 'model' ? styles.modelBtnActive : ''}`}
              onClick={() => {
                // A specific model → dropdown menu. No model → model-selector modal.
                if (modelSelected) toggle('model');
                else onOpenModelModal?.();
              }}
              aria-expanded={openMenu === 'model'}
            >
              <span
                ref={labelRef}
                className={styles.modelBtnLabel}
                style={{ maxWidth: modelMaxWidth }}
              >
                {modelSelected ? modelName : 'All data models'}
              </span>
              <Icon name="chevron-down" size="m" />
            </button>
            {modelSelected && openMenu === 'model' && (
              <div className={popoverClass}>
                <ModelMenu instructions={instructions} />
              </div>
            )}
          </div>

          {/* Deep analysis chip */}
          {deepAnalysis && (
            <button
              className={styles.deepChip}
              onMouseEnter={() => setInternalChipHovered(true)}
              onMouseLeave={() => setInternalChipHovered(false)}
              onClick={() => onDeepAnalysisChange?.(false)}
              aria-label="Remove deep analysis"
            >
              <span className={styles.deepChipIcon}>
                <DeepAnalysisGlyph size={16} />
              </span>
              {!chipCompact && <span ref={chipTextRef}>Deep analysis</span>}
              {/* Cross slot is always reserved (both compact and full-text) so hovering
                 never changes the chip's rendered width — the layout math above reads
                 real DOM widths, so an unreserved cross would silently break the 24px
                 min-gap guarantee the moment the chip was hovered while still full-text. */}
              <span
                className={styles.deepChipRemove}
                style={{ opacity: isChipHovered ? 1 : 0 }}
              >
                <Icon name="cross" size="s" />
              </span>
            </button>
          )}
        </div>

        {/* Right actions */}
        <div className={styles.rightActions} ref={rightRef}>
          {/* Connectors button (when placed beside the send arrow) */}
          {connectorsPlacement === 'right' && (
            <div className={styles.menuAnchor}>
              <button
                className={`${styles.plusBtn} ${openMenu === 'connectors' ? styles.plusBtnActive : ''}`}
                onClick={() => toggle('connectors')}
                aria-label="Connectors"
                aria-expanded={openMenu === 'connectors'}
              >
                <ConnectorsGlyph size={16} />
              </button>
              {openMenu === 'connectors' && (
                <div className={`${popoverClass} ${styles.menuPopoverRight}`}>
                  <ConnectorsMenu />
                </div>
              )}
            </div>
          )}

          {/* Primary action — Send, or Stop while a response is generating */}
          {generating ? (
            <button className={styles.sendBtn} aria-label="Stop" onClick={() => onStop?.()}>
              <StopGlyph size={10} />
            </button>
          ) : (
            <button
              className={styles.sendBtn}
              aria-label="Send"
              onClick={() => { if (value.trim()) onSend?.(); }}
            >
              <Icon name="arrow-up" size="m" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Interactive playground ────────────────────────────────────────────────────

export type PromptBarMode = 'landing' | 'asked';
export type PromptBarState = 'default' | 'hover' | 'selected';

interface PromptBarPlaygroundProps {
  mode: PromptBarMode;
  onModeChange: (m: PromptBarMode) => void;
  state: PromptBarState;
  modelSelected: boolean;
  modelName: string;
  deepAnalysis: boolean;
  onDeepAnalysisChange: (v: boolean) => void;
  connectorsPlacement: ConnectorsPlacement;
  googleDrive: boolean;
  skills: boolean;
  instructions: boolean;
  highlightedText?: string;
  onRemoveHighlight?: () => void;
  files?: UserMessageFile[];
  onRemoveFile?: (index: number) => void;
  /** A response is generating — primary button shows Stop instead of Send. */
  generating?: boolean;
  onStop?: () => void;
  /** Resizable frame width in px, or null for full width (max 800). */
  frameWidth: number | null;
  frameRef: RefObject<HTMLDivElement | null>;
  onDragStart: (e: React.MouseEvent) => void;
}

export function PromptBarPlayground({
  mode,
  onModeChange,
  state,
  modelSelected,
  modelName,
  deepAnalysis,
  onDeepAnalysisChange,
  connectorsPlacement,
  googleDrive,
  skills,
  instructions,
  highlightedText,
  onRemoveHighlight,
  files,
  onRemoveFile,
  generating = false,
  onStop,
  frameWidth,
  frameRef,
  onDragStart,
}: PromptBarPlaygroundProps) {
  const [openMenu, setOpenMenu] = useState<OpenMenu>('none');
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState('');
  const [modelModalOpen, setModelModalOpen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  // Close menus / blur when clicking outside the bar itself (not the whole
  // playground — that fills the canvas, so it'd never blur).
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenMenu('none');
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSend = () => {
    onModeChange('asked');
    setOpenMenu('none');
    setValue('');
  };

  return (
    <div
      className={`${styles.playground} ${mode === 'landing' ? styles.modeLanding : styles.modeAsked}`}
    >
      <div
        className={styles.barBlock}
        ref={frameRef}
        style={{ width: frameWidth !== null ? frameWidth : '100%' }}
      >
        <div ref={barRef}>
        <PromptBarCore
          focused={focused || state === 'selected'}
          forceHover={state === 'hover'}
          openMenu={openMenu}
          onOpenMenuChange={setOpenMenu}
          deepAnalysis={deepAnalysis}
          onDeepAnalysisChange={onDeepAnalysisChange}
          modelSelected={modelSelected}
          modelName={modelName}
          onOpenModelModal={() => setModelModalOpen(true)}
          value={value}
          onValueChange={setValue}
          onFocus={() => setFocused(true)}
          onSend={handleSend}
          generating={generating}
          onStop={onStop}
          minLines={mode === 'landing' && !(files && files.length > 0) ? 2 : 1}
          menuDirection={mode === 'landing' ? 'down' : 'up'}
          connectorsPlacement={connectorsPlacement}
          googleDrive={googleDrive}
          skills={skills}
          instructions={instructions}
          highlightedText={highlightedText}
          onRemoveHighlight={onRemoveHighlight}
          files={files}
          onRemoveFile={onRemoveFile}
        />
        </div>

        {/* Drag handle on right edge — resize between 352 and 800px */}
        <div className={styles.dragHandle} onMouseDown={onDragStart} title="Drag to resize">
          <div className={styles.dragHandleBar} />
        </div>
      </div>

      <Modal
        isOpen={modelModalOpen}
        onClose={() => setModelModalOpen(false)}
        title="Model selector"
      >
        <p>model selector modal</p>
      </Modal>
    </div>
  );
}

export default PromptBarCore;
