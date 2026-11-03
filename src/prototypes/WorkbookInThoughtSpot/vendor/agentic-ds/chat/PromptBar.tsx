import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import type { ReactNode, RefObject } from 'react';
import { Icon } from '@components/icons';
import { Modal } from '@components/Modal';
import { Tooltip } from '@components/Tooltip';
import { Toggle } from '@components/Toggle';
import { FileCard, type UserMessageFile } from './UserMessage';
import { useSquirclePath } from './useSquirclePath';
import styles from './PromptBar.module.css';
import attachIcon from './assets/Attach.svg';
import skillsIcon from './assets/skills.svg';
import connectorsIcon from './assets/connectors-l.svg';
import deepAnalysisIcon from './assets/deep-analysis.svg';
import googleDriveIcon from './assets/google-drive.png';

// ── Types ─────────────────────────────────────────────────────────────────────

export type OpenMenu = 'none' | 'plus' | 'model' | 'connectors';
type MenuDirection = 'down' | 'up';

const LINE_HEIGHT = 24; // px — matches .textarea line-height
const MAX_LINES = 7;
const TOP_PAD = 16; // px — textarea top inset (scrolls away so text bleeds to top)

const DEFAULT_PLACEHOLDER = "Press '/' for skills and '@' to add context";

export interface PromptBarCoreProps {
  /**
   * Pins the focused/selected style on or off.
   *
   * Omit it and the bar tracks its own focus, which is what a real surface
   * wants. The spec sheets pass it so a state can be held for inspection.
   */
  focused?: boolean;
  /**
   * Which dropdown menu is open. Omit both this and `onOpenMenuChange` and the
   * bar opens its own menus; pass them to drive it from outside.
   */
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
  onBlur?: () => void;
  onSend?: () => void;
  /** A response is generating — primary button shows Stop instead of Send. */
  generating?: boolean;
  onStop?: () => void;
  /** How Stop is painted. 'primary' is the documented default (brand fill,
   *  inverse glyph); 'secondary' is the muted fill with a content-primary glyph,
   *  used while the agent is paused waiting on the user. */
  stopAppearance?: 'primary' | 'secondary';
  /** Placeholder text. Defaults to the product's skills-and-context hint. */
  placeholder?: string;
  /** Minimum content height in lines (landing = 2, asked = 1). */
  minLines?: number;
  /** Which way menus open. */
  menuDirection?: MenuDirection;
  /** Show the data-model chip. Off for surfaces that pick sources elsewhere. */
  showModel?: boolean;
  /** Hide the + button. For surfaces that gather context somewhere else
   *  entirely (a sources rail or card), so the bar is only for typing. */
  showPlus?: boolean;
  /** Same as `showModel`; the name the Spotter refresh hosts use. */
  showModelPicker?: boolean;
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
  /** How the left-hand action controls are painted — outline when they sit
   *  beside other outlined controls, ghost otherwise. */
  actionAppearance?: ActionAppearance;
  /** Host-supplied control rendered in the right actions, before Send. */
  rightSlot?: ReactNode;
  /** A file-pulling MCP (Google Drive) is connected — shows it in the + menu. */
  googleDrive?: boolean;
  /** Connector rows for the Connectors menu. Defaults to the DS sample set;
   *  pass a list to show the connectors a given surface actually offers. */
  connectors?: Connector[];
  /** Fires when a connector row is toggled or connected, with the new list, so
   *  a surface can keep what the user connected. */
  onConnectorsChange?: (connectors: Connector[]) => void;
  /** Count shown on the connectors button, e.g. how many are switched on. */
  connectorsBadge?: number;
  /** Hover text for the connectors button, e.g. which ones are on. */
  connectorsTooltip?: string;
  /** Hover text for the data model chip, e.g. the chosen sources. */
  modelTooltip?: string;
  /** Replaces the + menu's contents, for surfaces that add other things. */
  plusMenuContent?: React.ReactNode;
  /** Rendered just after the + button, e.g. what has been added so far. */
  leftExtras?: React.ReactNode;
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

/**
 * Where the connectors control lives.
 * - 'menu'  — a row inside the + menu
 * - 'right' — an icon button beside the send arrow
 * - 'left'  — an icon button in the + button's slot
 * - 'none'  — nowhere; the host is surfacing connectors itself (e.g. via
 *             `rightSlot`), so the bar shouldn't offer a second entry point
 */
export type ConnectorsPlacement = 'menu' | 'right' | 'none' | 'left';

/**
 * How the bar's left-hand action controls are painted — the + button and the
 * data-model picker together, plus the gap between them. `outline` is for hosts
 * that put an outlined control (a pill) in the same action row, so the whole row
 * reads as one class of control.
 */
export type ActionAppearance = 'ghost' | 'outline';

// Deep-analysis glyph drawn inline so it inherits the current text colour
// (the imported SVG asset has a fixed grey fill and can't be re-tinted).
/** The deep-analysis atom. Exported so other Spotter surfaces (quick actions,
 *  the landing pills) can use the same glyph the composer's chip carries. */
export function DeepAnalysisGlyph({ size = 14 }: { size?: number }) {
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
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M13.875 15.25V16.75C13.875 17.2332 13.4832 17.625 13 17.625C12.5168 17.625 12.125 17.2332 12.125 16.75V15.25C12.125 14.7668 12.5168 14.375 13 14.375C13.4832 14.375 13.875 14.7668 13.875 15.25Z" fill="currentColor" />
      <path d="M2.875 1.25V2.75C2.875 3.23325 2.48325 3.625 2 3.625C1.51675 3.625 1.125 3.23325 1.125 2.75L1.125 1.25C1.125 0.766751 1.51675 0.375 2 0.375C2.48325 0.375 2.875 0.766751 2.875 1.25Z" fill="currentColor" />
      <path d="M16.875 15.25V16.75C16.875 17.2332 16.4832 17.625 16 17.625C15.5168 17.625 15.125 17.2332 15.125 16.75V15.25C15.125 14.7668 15.5168 14.375 16 14.375C16.4832 14.375 16.875 14.7668 16.875 15.25Z" fill="currentColor" />
      <path d="M5.875 1.25V2.75C5.875 3.23325 5.48325 3.625 5 3.625C4.51675 3.625 4.125 3.23325 4.125 2.75V1.25C4.125 0.766751 4.51675 0.375 5 0.375C5.48325 0.375 5.875 0.766751 5.875 1.25Z" fill="currentColor" />
      <path d="M2 5.25C2 5.80228 2.44772 6.25 3 6.25H4C4.55228 6.25 5 5.80229 5 5.25V3.75L2 3.75L2 5.25ZM5 1.75C6.10457 1.75 7 2.64543 7 3.75V5.25C7 6.90685 5.65685 8.25 4 8.25H3C1.34315 8.25 -2.56375e-08 6.90685 0 5.25L1.31134e-07 3.75C2.27699e-07 2.64543 0.895431 1.75 2 1.75L5 1.75Z" fill="currentColor" />
      <path d="M16 12.75C16 12.1977 15.5523 11.75 15 11.75H14C13.4477 11.75 13 12.1977 13 12.75V14.25L16 14.25V12.75ZM13 16.25C11.8954 16.25 11 15.3546 11 14.25V12.75C11 11.0931 12.3431 9.75 14 9.75H15C16.6569 9.75 18 11.0931 18 12.75L18 14.25C18 15.3546 17.1046 16.25 16 16.25L13 16.25Z" fill="currentColor" />
      <path d="M13.5 4.75C13.5 3.7835 12.7165 3 11.75 3C10.7835 3 10 3.7835 10 4.75V13.25C10 15.3211 8.32107 17 6.25 17C4.17893 17 2.5 15.3211 2.5 13.25L2.5 7.25H4.5V13.25C4.5 14.2165 5.2835 15 6.25 15C7.2165 15 8 14.2165 8 13.25L8 4.75C8 2.67893 9.67893 1 11.75 1C13.8211 1 15.5 2.67893 15.5 4.75V10.625L13.5 10.625V4.75Z" fill="currentColor" />
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

export type ConnectorStatus = 'on' | 'off' | 'connect';

export interface Connector {
  id: string;
  name: string;
  status: ConnectorStatus;
  // Placeholder logo background, used when `logo` is absent. These are the
  // third-party brand colours (data), so they stay literal in both themes.
  color?: string;
  /** Real brand mark. Falls back to a coloured monogram when omitted. */
  logo?: ReactNode;
}

export type PromptBarConnector = Connector;

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

/** Paints a single-colour SVG asset in currentColor (via CSS mask), so it follows the theme. */
function MaskIcon({ src }: { src: string }) {
  return (
    <span
      className={styles.maskIcon}
      style={{ ['--mask-icon-src' as string]: `url(${src})` }}
      aria-hidden="true"
    />
  );
}

function ConnectorsMenu({
  items,
  onItemsChange,
}: {
  items?: Connector[];
  onItemsChange?: (connectors: Connector[]) => void;
}) {
  const [connectors, setConnectors] = useState(items ?? CONNECTORS);

  // The host can swap the set (e.g. per analyst); re-seed when it does.
  useEffect(() => {
    if (items) setConnectors(items);
  }, [items]);
  const visible = connectors.slice(0, MAX_VISIBLE_CONNECTORS);
  const hasMore = connectors.length > MAX_VISIBLE_CONNECTORS;

  // Clicking anywhere on a row does its action: a connected connector toggles
  // on/off; an unconnected one ("Connect") connects and turns on.
  const handleRow = (c: Connector) =>
    setConnectors((cs) => {
      const next = cs.map((x): Connector =>
        x.id === c.id
          ? { ...x, status: x.status === 'on' ? 'off' : 'on' }
          : x
      );
      onItemsChange?.(next);
      return next;
    });

  return (
    <div className={styles.menu}>
      <div className={styles.menuList}>
        {visible.map((c) => (
          <button className={styles.connectorRow} key={c.id} onClick={() => handleRow(c)}>
            {c.logo ? (
              <span className={styles.connectorLogo} style={{ background: 'transparent' }}>
                {c.logo}
              </span>
            ) : (
              <span className={styles.connectorLogo} style={{ background: c.color }}>
                {c.name.charAt(0)}
              </span>
            )}
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
  connectors,
  onConnectorsChange,
}: {
  deepOn: boolean;
  onDeepToggle: () => void;
  googleDrive: boolean;
  skills: boolean;
  showConnectors: boolean;
  connectors?: Connector[];
  onConnectorsChange?: (connectors: Connector[]) => void;
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
            <MaskIcon src={attachIcon} />
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
              <MaskIcon src={connectorsIcon} />
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
                <ConnectorsMenu items={connectors} onItemsChange={onConnectorsChange} />
              </div>
            )}
          </div>
        )}
        {skills && (
          <button className={styles.menuItem}>
            <span className={styles.menuItemIcon}>
              <MaskIcon src={skillsIcon} />
            </span>
            <span className={styles.menuItemLabel}>Skills</span>
            <span className={styles.menuItemChevron}>
              <Icon name="chevron-right" size="s" />
            </span>
          </button>
        )}
        <button className={styles.menuItem} onClick={() => onDeepToggle()}>
          <span className={styles.menuItemIcon}>
            <MaskIcon src={deepAnalysisIcon} />
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

function ModelMenu({
  instructions,
  onChangeModel,
}: {
  instructions: boolean;
  onChangeModel?: () => void;
}) {
  return (
    <div className={styles.menu}>
      <div className={styles.menuList}>
        <button className={styles.menuItem} onClick={onChangeModel}>
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
  focused,
  openMenu: controlledMenu,
  onOpenMenuChange,
  deepAnalysis = false,
  onDeepAnalysisChange,
  chipHovered = false,
  value = '',
  onValueChange,
  onFocus,
  onBlur,
  onSend,
  generating = false,
  onStop,
  stopAppearance = 'primary',
  placeholder = DEFAULT_PLACEHOLDER,
  minLines = 1,
  menuDirection = 'down',
  showModel: showModelProp = true,
  showModelPicker,
  showPlus = true,
  modelSelected = false,
  modelName = 'Mixpanel Daily Events',
  forceHover = false,
  onOpenModelModal,
  connectorsPlacement = 'menu',
  actionAppearance = 'ghost',
  rightSlot,
  googleDrive = false,
  skills = false,
  connectors,
  onConnectorsChange,
  connectorsBadge,
  connectorsTooltip,
  modelTooltip,
  plusMenuContent,
  leftExtras,
  instructions = true,
  highlightedText,
  onRemoveHighlight,
  files = [],
  onRemoveFile,
}: PromptBarCoreProps) {
  const showModel = showModelPicker ?? showModelProp;
  const [internalChipHovered, setInternalChipHovered] = useState(false);
  const isChipHovered = chipHovered || internalChipHovered;

  // Focus and menu state fall back to the bar's own when the host doesn't
  // control them. A surface that just wants a working prompt bar gets the
  // highlight and the menus for free; the spec sheets still pin either one.
  const [selfFocused, setSelfFocused] = useState(false);
  const [selfMenu, setSelfMenu] = useState<OpenMenu>('none');
  const menuControlled = controlledMenu !== undefined || onOpenMenuChange !== undefined;
  const openMenu = menuControlled ? controlledMenu ?? 'none' : selfMenu;
  const setMenu = (m: OpenMenu) => {
    if (!menuControlled) setSelfMenu(m);
    onOpenMenuChange?.(m);
  };

  // The whole bar, so an outside click can drop focus and close any menu. Both
  // live on the bar rather than the textarea — a menu is open "inside" the bar
  // even while the textarea has no caret.
  const barBoxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (focused !== undefined && menuControlled) return;
    const onDown = (e: MouseEvent) => {
      if (barBoxRef.current?.contains(e.target as Node)) return;
      setSelfFocused(false);
      if (!menuControlled) setSelfMenu('none');
      else onOpenMenuChange?.('none');
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [focused, menuControlled, onOpenMenuChange]);

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

  const isFocused = (focused ?? selfFocused) || openMenu !== 'none';

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

  const toggle = (menu: OpenMenu) => setMenu(openMenu === menu ? 'none' : menu);

  // When a highlight pill sits above the input, the bar supplies the top inset,
  // so the textarea drops its scroll-away top padding. (Files sit below the text.)
  const hasTopContent = !!highlightedText;
  const topPad = hasTopContent ? 0 : TOP_PAD;
  const minH = minLines * LINE_HEIGHT + topPad;
  const maxH = LINE_HEIGHT * MAX_LINES + topPad;

  // Auto-grow the textarea up to MAX_LINES, then it scrolls internally.
  const resize = useCallback(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const next = Math.min(el.scrollHeight, maxH);
    el.style.height = `${Math.max(next, minH)}px`;
  }, [maxH, minH]);

  useLayoutEffect(resize, [resize, value, minLines, topPad]);

  // The first measurement can land before the real font has loaded, and a fallback
  // face wraps the placeholder differently — enough to read as overflow and
  // latch the bar open at MAX_LINES. Measure again once the real font is in.
  useEffect(() => {
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) resize();
    });
    return () => {
      cancelled = true;
    };
  }, [resize]);

  // Re-measure whenever the bar changes width.
  //
  // A mis-measurement is otherwise permanent: `resize` only re-runs when the
  // text changes, so a bar that mounts into a not-yet-laid-out container
  // measures one line as overflowing, latches at MAX_LINES, and stays there for
  // as long as nobody types. Fonts.ready covers that only when the bar happens
  // to mount before the fonts land.
  //
  // Width, deliberately, not height — height is what this writes, so observing
  // it would feed back into itself.
  useEffect(() => {
    const el = taRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    let lastWidth = el.getBoundingClientRect().width;
    const observer = new ResizeObserver(() => {
      const width = el.getBoundingClientRect().width;
      if (width === lastWidth) return;
      lastWidth = width;
      resize();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [resize]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) onSend?.();
    }
  };

  return (
    <div
      ref={barBoxRef}
      className={barClass}
      style={{ paddingTop: hasTopContent ? 16 : 0 }}
    >
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
          placeholder={placeholder}
          rows={minLines}
          readOnly={!onValueChange}
          onChange={(e) => onValueChange?.(e.target.value)}
          onFocus={() => {
            setSelfFocused(true);
            onFocus?.();
          }}
          onBlur={onBlur}
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
        <div
          className={[
            styles.leftActions,
            actionAppearance === 'outline' ? styles.leftActionsOutline : '',
          ]
            .filter(Boolean)
            .join(' ')}
          ref={leftRef}
        >
          {/* Plus button + its menu, anchored to the button. In the 'left'
              placement the connectors button takes this slot instead, because
              that surface offers nothing else to add. */}
          <div className={styles.menuAnchor}>
            {connectorsPlacement === 'left' ? (
              <Tooltip content={connectorsTooltip ?? ''} placement="top" disabled={!connectorsTooltip}>
              <button
                className={`${styles.plusBtn} ${styles.connectorsLeftBtn} ${openMenu === 'connectors' ? styles.plusBtnActive : ''}`}
                onClick={() => toggle('connectors')}
                aria-label="Connectors"
                aria-expanded={openMenu === 'connectors'}
              >
                <ConnectorsGlyph size={16} />
                {!!connectorsBadge && connectorsBadge > 0 && (
                  <span aria-hidden className={styles.connectorsBadge}>
                    {connectorsBadge}
                  </span>
                )}
              </button>
              </Tooltip>
            ) : showPlus ? (
            <button
              className={[
                styles.plusBtn,
                actionAppearance === 'outline' ? styles.plusBtnOutline : '',
                openMenu === 'plus' ? styles.plusBtnActive : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => toggle('plus')}
              aria-label="Add context"
              aria-expanded={openMenu === 'plus'}
            >
              <Icon name="plus" size="m" />
            </button>
            ) : null}
            {leftExtras && <span className={styles.leftExtras}>{leftExtras}</span>}
            {openMenu === 'connectors' && connectorsPlacement === 'left' && (
              <div className={popoverClass}>
                <ConnectorsMenu items={connectors} onItemsChange={onConnectorsChange} />
              </div>
            )}
            {openMenu === 'plus' && plusMenuContent && (
              <div className={popoverClass}>{plusMenuContent}</div>
            )}
            {openMenu === 'plus' && !plusMenuContent && (
              <div className={popoverClass}>
                <PlusMenu
                  deepOn={deepAnalysis}
                  onDeepToggle={() => onDeepAnalysisChange?.(!deepAnalysis)}
                  googleDrive={googleDrive}
                  skills={skills}
                  showConnectors={connectorsPlacement === 'menu'}
                  connectors={connectors}
                  onConnectorsChange={onConnectorsChange}
                />
              </div>
            )}
          </div>

          {/* Model picker button + its menu, anchored to the button */}
          {showModel && (
          <div className={styles.menuAnchor}>
            <Tooltip content={modelTooltip ?? ''} placement="top" disabled={!modelTooltip}>
            <button
              className={[
                styles.modelBtn,
                actionAppearance === 'outline' ? styles.modelBtnOutline : '',
                openMenu === 'model' ? styles.modelBtnActive : '',
              ]
                .filter(Boolean)
                .join(' ')}
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
            </Tooltip>
            {modelSelected && openMenu === 'model' && (
              <div className={popoverClass}>
                <ModelMenu instructions={instructions} onChangeModel={onOpenModelModal} />
              </div>
            )}
          </div>
          )}

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
          {/* Host-supplied control, before the primary action */}
          {rightSlot}

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
                  <ConnectorsMenu items={connectors} onItemsChange={onConnectorsChange} />
                </div>
              )}
            </div>
          )}

          {/* Primary action — Send, or Stop while a response is generating */}
          {generating ? (
            <button
              className={
                stopAppearance === 'secondary'
                  ? `${styles.sendBtn} ${styles.stopBtnSecondary}`
                  : styles.sendBtn
              }
              aria-label="Stop"
              onClick={() => onStop?.()}
            >
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

/**
 * The Refresh composer. Named export is the canonical one; the default export
 * is kept so older `import PromptBar from './PromptBar'` sites keep working.
 */

export { PromptBarCore as PromptBar };
export default PromptBarCore;
