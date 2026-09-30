import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@components/Button';
import { SearchInput } from '@components/SearchInput';
import { Toggle } from '@components/Toggle';
import { Radio } from '@components/Radio';
import { Checkbox } from '@components/Checkbox';
import { Typography } from '@components/Typography';
import { Divider } from '@components/Divider';
import { Link } from '@components/Link';
import { SegmentedControl } from '@components/SegmentedControl';
import { Tabs } from '@components/Tabs';
import { Select } from '@components/Select';
import { Menu } from '@components/Menu';
import { List } from '@components/List';
import { Popover } from '@components/Popover';
import { AnchoredMenu } from './components/AnchoredMenu';
import { RdModal } from '@components/RdModal';
import { TextInput } from '@components/TextInput';
import { TextArea } from '@components/TextArea';
import { Table } from '@components/Table';
import './dme.css';
// @ts-expect-error -- init-dme.js is a plain JS module without a .d.ts declaration
import { initDME } from './init-dme.js';
import { AgentPanel } from '../_agentic/index';
import { TableCanvas, ColumnTree, joinKey } from '../_datamodel/index';
import type { TablePositionData, JoinInfo, ColumnTreeData } from '../_datamodel/index';
import { OverlayLoading } from '@components/OverlayLoading';
import { Icon } from '@components/icons';
import PreviewPanel from './components/PreviewPanel';
import PreviewPanel3 from './components/PreviewPanel3';
import TablePickerV2, { ColumnChip } from './components/TablePickerV2';
import tablePickerStyles from './components/TablePickerV2.module.css';
import FormulaEditorModal from './components/FormulaEditorModal';
import type { FormulaDraft } from './components/FormulaEditorModal';
import ParameterEditorModal from './components/ParameterEditorModal';
import type { ParameterDraft } from './components/ParameterEditorModal';
import EditJoinModal from './components/EditJoinModal';
import type { EditJoinResult } from './components/EditJoinModal';
import TableBrowserModal from './components/TableBrowserModal';
import TableColumnSidePanel from './components/TableColumnSidePanel';
import { SearchDataExplorations } from './SearchDataExplorations';
import { SearchDataExplorations as QueryAsIs } from './components/QueryAsIs';

// Formula/Filters/Parameters dock (ported exactly from DataStudioV2 MVP's left
// browser panel) — fixed to the bottom of the Tables pane, table list scrolls
// in the remaining space above.
// count/children are optional so a row can be a plain entry (e.g. Settings)
// rather than a counted collection with an expandable body.
// `onAdd` puts the section's "+" in the header, left of the chevron — Komal:
// "the plus button should always be available on all headers". The count now
// sits alongside it rather than being replaced by it: a panel read as a model
// inventory has to show quantities.
//
// The border and ground moved out of inline styles into .dock-row /
// .dock-row-header in dme.css, so the tint/box treatments below can restyle
// them from a parent class instead of fighting inline styles with !important.
// Radiant has no badge component — Chip is the lavender column chip, which
// would read as data rather than chrome — so the count in both treatments is
// a token-styled span around a Radiant Typography. Tokens only, no
// hardcoded values.
const CountBadge: React.FC<{ count: number }> = ({ count }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    // 2026-09-25, audit item D: was a raw 18, which is off the 4px scale.
    flexShrink: 0, minWidth: 'var(--spacing-5)', padding: '0 var(--spacing-1)',
    borderRadius: 'var(--radius-full)',
    background: 'var(--rd-sys-color-background-subtle)',
  }}>
    <Typography variant="footnote" as="span" color="gray-light" noMargin>{count}</Typography>
  </span>
);

// The collapsed/expanded drawer height for every section except Tables, which
// takes the pane's remaining height instead. No Radiant token covers a drawer
// height, so it is at least named rather than inline (2026-09-25, audit D).
const DOCK_DRAWER_MAX_HEIGHT = 220;

// `fill` is the Tables section: it collapses like every other section, but
// while open its body takes the pane's remaining height rather than animating
// to a 220px drawer, so the table list scrolls in the space that's left.
const DockRow: React.FC<{ balance: PaneBalance; icon: React.ReactNode; label: string; count?: number; open: boolean; onToggle?: () => void; onAdd?: () => void; addLabel?: string; fill?: boolean; children?: React.ReactNode }> = ({ balance, icon, label, count, open, onToggle, onAdd, addLabel, fill, children }) => {
  // The chevron leads the row in both treatments. Tint otherwise follows the
  // product's column browser — no type icon, a sentence-case label, a taller
  // row, the count plain on the right. Box stays compact: its icon, an
  // uppercase overline label, and the count as a badge beside it.
  const tint = balance === 'tint';
  // 2026-09-25, audit item D: gap/padding were 7, 9, 14 and 12/16 inline —
  // 7, 9 and 14 sit off the 4px scale entirely. On-scale now, and the
  // horizontal inset matches .dock-search-row and .dock-list's own
  // var(--spacing-4), so a section label lines up with the search field and
  // the rows underneath it instead of starting 2px to their left.
  const toggleStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: tint ? 'var(--spacing-3)' : 'var(--spacing-2)',
    flex: 1, minWidth: 0,
    padding: tint ? 'var(--spacing-4)' : 'var(--spacing-2) var(--spacing-4)',
    border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer',
  };
  const headerContent = (
    <>
      <span style={{ display: 'flex', flexShrink: 0, transition: 'transform var(--duration-normal) var(--easing-standard)', transform: open ? 'rotate(90deg)' : 'none' }}>
        <Icon name="chevron-right" size={tint ? 's' : 'xs'} color={tint ? 'var(--rd-sys-color-content-primary)' : 'var(--rd-sys-color-content-secondary)'} />
      </span>
      {!tint && icon}
      {/* Section chrome, not content. 2026-09-25, Komal: "use the same
          section headers font and color in the left panel that are being
          used in the query column selector" — box now matches that same
          'content-label' / color 'base' (16px / 500 / content-primary,
          sentence case) instead of its previous uppercase 'overline'
          treatment. Tint keeps its own 'content-label-subhead' (14px)
          unchanged — only the box label was called out. The count itself —
          CountBadge — is the same pill in both treatments, next to the
          title (Komal: "in tint, use badges... placed next to the section
          title similar to box"). */}
      <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
        {/* 2026-09-25, Komal: "the fonts of the table name, formula, filters
            and parameters look too thick. Use the correct font... strictly
            from Radiant." Box was on 'content-label' (16/500) — Radiant's
            label for content headings on full-width surfaces. In a 300px
            rail that reads heavy; the next step down its own label scale,
            'content-label-subhead' (14/500), is the one meant for subheads,
            and is what tint already used. Both treatments now share it. */}
        <Typography variant="content-label-subhead" as="span" color="base" noMargin style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</Typography>
        {typeof count === 'number' && <CountBadge count={count} />}
      </span>
    </>
  );

  // 2026-09-25, audit item E: the header used to be one <button> with the
  // section's own "+" Button nested inside it — invalid HTML — reached
  // through a <span role="presentation" onClick> that stopped propagation, so
  // the "+" was a click target with no role and the whole row was a button
  // containing a button. Now the header is a plain flex row holding two real
  // sibling controls: the toggle (chevron, icon, label, count) and the "+".
  // Both are genuinely focusable and neither nests inside the other, so the
  // stopPropagation hack is gone too.
  return (
    <div className="dock-row" data-open={open} data-fill={fill ? 'true' : undefined}>
      <div className="dock-row-header">
        <button type="button" className="dock-row-toggle" onClick={onToggle} style={toggleStyle} aria-expanded={open}>
          {headerContent}
        </button>
        {onAdd && (
          <span style={{ display: 'flex', flexShrink: 0, paddingRight: 'var(--spacing-2)' }}>
            <Button variant="tertiary" size="small" iconOnly icon="plus" aria-label={addLabel ?? `Add to ${label}`} onClick={onAdd}>
              {addLabel ?? `Add to ${label}`}
            </Button>
          </span>
        )}
      </div>
      <div style={fill && open
        ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto' }
        : { maxHeight: open ? DOCK_DRAWER_MAX_HEIGHT : 0, overflowY: open ? 'auto' : 'hidden', transition: 'max-height var(--duration-normal) var(--easing-standard)' }}>
        {children}
      </div>
    </div>
  );
};

// One row of a dock section's list — formulas, filters and parameters all use
// it, so the three read identically: the name opens the object's editor, and
// the "..." menu carries Edit / Make a copy / Delete. `detail` is the row's
// value (a formula's expression, a filter's `col = val`, a parameter's value),
// shown on hover rather than in the row, so the name is all that competes for
// the eye. Filters and parameters have no editor yet and pass a no-op onEdit,
// the same placeholder convention as the "+" on their headers.
//
// The menu surface is Radiant's <Menu>, but it's positioned by the prototype's
// AnchoredMenu rather than rendered inline — the dock body is a
// `max-height: 220; overflow-y: auto` box, which clips any absolutely
// positioned child, so an inline menu would be cut off on the lower rows.
// Same pairing the canvas zoom menu already uses in this file.
const DockListRow: React.FC<{
  name: string;
  detail?: string;
  onEdit: () => void;
  onCopy: () => void;
  onDelete: () => void;
}> = ({ name, detail, onEdit, onCopy, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const run = (fn: () => void) => () => { setMenuOpen(false); fn(); };

  return (
    // Same row shape and type as a table row in the Tables section (2026-09-22,
    // Komal: "across tables, formula, filters and parameters — use the same
    // styling for lists. Use the same fonts as tables in others"): the name
    // wears TablePickerV2's own .tableName (sm / medium / content-primary)
    // rather than Radiant's small Link, which set these lists a size and
    // weight apart from the tables above them. Still a button — the name
    // opens the object's editor — exactly as Option 2's AddedTableRow does.
    <div className="dock-list-row" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', minWidth: 0 }}>
      <button
        type="button"
        onClick={onEdit}
        title={detail}
        style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
      >
        <span className={tablePickerStyles.tableName}>{name}</span>
      </button>
      <Button
        ref={menuBtnRef}
        variant="tertiary"
        size="small"
        iconOnly
        icon="more"
        aria-label={`${name} actions`}
        onClick={() => setMenuOpen(o => !o)}
      >
        {`${name} actions`}
      </Button>
      <AnchoredMenu
        open={menuOpen}
        anchorRef={menuBtnRef}
        onClose={() => setMenuOpen(false)}
        placement="bottom-end"
      >
        <Menu onClose={() => setMenuOpen(false)}>
          <Menu.Item onClick={run(onEdit)}>Edit</Menu.Item>
          <Menu.Item onClick={run(onCopy)}>Make a copy</Menu.Item>
          <Menu.Item onClick={run(onDelete)}>Delete</Menu.Item>
        </Menu>
      </AnchoredMenu>
    </div>
  );
};

// Tables-section Option 2's populated nav row (2026-09-21) — a table already
// on the canvas, styled like TablePickerV2's plain-text row (chevron + name,
// no chip, no drag handle: nothing here is draggable) rather than the
// drag-oriented shared ColumnTree. Removal is the "..." menu only, matching
// DockListRow's own pattern — never a row-level "x".
// No "..." menu (Komal, 2026-09-22: "remove the 3 dot menu") — a table is
// still removable by reopening the "+" picker and unticking its columns,
// which already fully removes it (see handleOption2Confirm). Row and column
// styling reuses Option 1's own TablePickerV2.module.css classes verbatim
// (Komal: "the table name, make it look like option 1, without the plus
// icon" / "for the columns, use the same UI as option 1") rather than a
// hand-approximated copy, so the two are pixel-identical apart from the "+"
// (not needed — these tables are already on the canvas) and the drag cursor
// (overridden to pointer — nothing here is draggable). No checkboxes on the
// expanded columns either (Komal, 2026-09-22: "addition and removal of
// columns happen from the data browser") — this list is read-only, showing
// only the columns already added; the "Add tables and columns" pop-up is the
// only place that adds or removes one.
const AddedTableRow: React.FC<{
  name: string;
  addedColumns: string[];
  isOpen: boolean;
  onToggleOpen: () => void;
  onEdit: () => void;
}> = ({ name, addedColumns, isOpen, onToggleOpen, onEdit }) => {
  // Fragment at the top level (colList is a sibling of the row div, both
  // direct children of .list) — TablePickerV2.module.css's
  // `.tableRow:not(:first-child) { margin-top: var(--spacing-3) }` rule (the
  // table-to-table rhythm) only fires when .tableRow is a direct, non-first
  // child of the shared list container (Komal, 2026-09-22: "the spacing and
  // alignment is off again... CLEAN IT UP"). The row itself is back to being
  // a <div> wrapping two separate buttons (toggle + edit) rather than one
  // button being the whole row — needed now that there are two actions,
  // and a <button> can't contain another <button>. Matches TablePickerV2's
  // own div>button+span+button shape exactly.
  return (
    <>
      <div className={`${tablePickerStyles.tableRow} option2-table-row`} style={{ cursor: 'default' }}>
        <button
          type="button"
          onClick={onToggleOpen}
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', flex: 1, minWidth: 0, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
        >
          {/* 2026-09-25, Komal: "always keep the table expand/collapse
              active" — content-secondary read as a muted/disabled-looking
              gray even though the control was always fully clickable;
              content-primary keeps it looking active regardless of hover
              state. */}
          <span className={`${tablePickerStyles.chevron} ${isOpen ? tablePickerStyles.chevronOpen : ''}`}>
            <Icon name="chevron-right" size="xs" color="var(--rd-sys-color-content-primary)" />
          </span>
          <span className={tablePickerStyles.tableName}>{name}</span>
        </button>
        <button
          type="button"
          className="option2-edit-btn"
          onClick={onEdit}
          aria-label={`Edit ${name}`}
          title={`Edit ${name}`}
          // 2026-09-25, audit item D: the 20x20 hit area was raw; it is the
          // same box TablePickerV2.module.css's own .add/.chevron use.
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 'var(--spacing-5)', height: 'var(--spacing-5)', flexShrink: 0, border: 'none', background: 'transparent', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--rd-sys-color-content-secondary)' }}
        >
          <Icon name="pencil" size="xs" />
        </button>
      </div>
      {isOpen && (
        <div className={tablePickerStyles.colList}>
          {addedColumns.map(c => (
            <div key={c} className={tablePickerStyles.colItem}>
              <ColumnChip label={c} />
            </div>
          ))}
        </div>
      )}
    </>
  );
};

// Case-insensitive match for the dock section searches.
const matchesQuery = (text: string, query: string) => text.toLowerCase().includes(query.trim().toLowerCase());

// "Make a copy" for the dock lists: the duplicate lands directly under the row
// it came from rather than at the end, with its name disambiguated.
const withCopy = <T extends { name: string }>(list: T[], item: T): T[] => {
  const taken = new Set(list.map(x => x.name));
  let name = `${item.name} (copy)`;
  for (let n = 2; taken.has(name); n++) name = `${item.name} (copy ${n})`;
  const next = list.slice();
  next.splice(list.findIndex(x => x.name === item.name) + 1, 0, { ...item, name });
  return next;
};

// Prototype-only: candidate treatments for separating the model sections
// (Formula/Filters/Parameters/Settings) from the table list.
//
//   tint  — the sections get their own sunken ground, like the search header
//   box   — each section becomes a bordered, rounded card on the base ground
//
// The sections stack vertically under the table list; tint and box differ
// purely by the dock wrapper's class styling.
type PaneBalance = 'tint' | 'box';



// The search at the top of a section's body, matching the one Tables carries.
// Tables pairs it with filter/sort buttons; these three are search only.
const DockSearch: React.FC<{ placeholder: string; value: string; onChange: (v: string) => void }> = ({ placeholder, value, onChange }) => (
  <div className="dock-search-row">
    <div style={{ flex: 1, minWidth: 0 }}>
      <SearchInput placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  </div>
);

// Radiant's "Muted alert illustration" pattern (Figma Radiant 3.0, "Muted
// Alert" page, node 25122:178936) — every instance is the same 140×118
// canvas, a corner-to-corner clip, and a centerpiece with the family's slow
// bob/twinkle motion; only the centerpiece's own content (and where its own
// accents sit) differs per instance. First used for Tables' own empty state
// (2026-09-25, Komal: "use this illustration for the empty state of
// tables"), extracted here into a shared, accent-agnostic frame so Formula/
// Filters/Parameters (2026-09-25, Komal: "use the same format, illustration
// style... instead of data, use relevant illustrations") can reuse the exact
// canvas/clip/motion plumbing while supplying their own accent layout inside
// `centerpiece` — see DATA_CENTERPIECE vs. ROUND_CENTERPIECE below, which are
// two different Muted Alert templates in the same Figma family (traced disc
// stack vs. a plain muted circle with the icon knocked out in white, e.g.
// "Pinboard", node 25122:178958).
const MutedAlertIllustration: React.FC<{ centerpiece: React.ReactNode; paused?: boolean; clipId: string }> = ({ centerpiece, paused, clipId }) => (
  <svg
    className={`empty-state-illo${paused ? ' empty-state-illo-paused' : ''}`}
    width="96"
    height="81"
    viewBox="0 0 140 118"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clipPath={`url(#${clipId})`}>
      {centerpiece}
    </g>
    <defs>
      <clipPath id={clipId}>
        <rect width="140" height="118" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

// Tables' own centerpiece — the traced disc-stack template, unchanged from
// its original inline markup (corner dot-grid bottom-right, diagonal-stripe
// square top-left, the stack itself), just lifted out so it can be passed
// into the shared frame above.
const DATA_CENTERPIECE = (
  <>
    <g className="illo2-accent-dots" fill="#777E8B">
      {[
        { x0: 127.877, y0: 60.7886 },
        { x0: 98.78, y0: 60.7886 },
        { x0: 98.7799, y0: 92.0922 },
        { x0: 127.877, y0: 91.9998 },
      ].map((block, bi) => (
        Array.from({ length: 5 }).map((_, col) => (
          Array.from({ length: 5 }).map((_, row) => (
            <circle key={`${bi}-${col}-${row}`} cx={block.x0 - col * 6.005} cy={block.y0 + row * 6.005} r={1.38868} />
          ))
        ))
      ))}
    </g>
    <g className="illo2-accent-stripe">
      <mask id="illo-data-stripe-mask" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="11" y="-1" width="60" height="60">
        <path d="M67.4535 58.9996L63.0659 59L11.9994 26.129L11.9994 23.3049L67.4535 58.9996ZM70.9995 56.0324L70.9995 58.8575L11.9993 20.8805L11.9994 18.0564L70.9995 56.0324ZM59.2997 58.9996L54.9112 59L11.9994 31.3775L11.9996 28.5544L59.2997 58.9996ZM51.1441 58.9997L46.7565 58.9991L11.9996 36.627L11.9997 33.8029L51.1441 58.9997ZM42.9904 58.9996L38.6018 58.9991L11.9997 41.8755L11.9998 39.0514L42.9904 58.9996ZM34.8347 58.9997L30.4471 58.9991L11.9988 47.125L11.9989 44.3009L34.8347 58.9997ZM26.6801 58.9997L22.2934 58.9991L11.9989 52.3735L11.999 49.5494L26.6801 58.9997ZM18.5264 58.9997L14.1378 58.9992L12 57.6229L11.9991 54.7979L18.5264 58.9997ZM70.9994 50.7839L70.9993 53.608L11.9992 15.632L11.9992 12.8069L70.9994 50.7839ZM70.9993 45.5344L70.9992 48.3585L11.999 10.3825L11.9991 7.55841L70.9993 45.5344ZM70.9992 40.2849L70.9991 43.11L11.9998 5.13201L12 2.30889L70.9992 40.2849ZM16.5655 -0.000182211L70.9991 35.0364L70.999 37.8615L12.4079 0.147334L12.4622 -0.000219907L16.5655 -0.000182211ZM24.7201 -0.0001991L70.999 29.7879L70.9989 32.612L20.3335 -0.000796976L24.7201 -0.0001991ZM32.8758 -0.000251076L70.9998 24.5384L70.9997 27.3625L28.4892 -0.000848952L32.8758 -0.000251076ZM41.0305 -0.000267966L70.9997 19.2899L70.9996 22.114L36.6429 -0.000830755L41.0305 -0.000267966ZM49.1852 -0.000284855L70.9996 14.0414L70.9995 16.8655L44.7966 -0.000812558L49.1852 -0.000284855ZM57.3398 -0.000301745L70.9995 8.79195L70.9994 11.616L52.9522 -0.000864534L57.3398 -0.000301745ZM65.4945 -0.000318634L70.9994 3.54344L70.9993 6.36754L61.1069 9.4509e-05L65.4945 -0.000318634ZM71 0.000118459L70.9992 1.11806L69.2616 7.76195e-05L71 0.000118459Z" fill="black" />
      </mask>
      <g mask="url(#illo-data-stripe-mask)">
        <rect x="12.0793" y="0.551514" width="58.8495" height="58.8495" fill="#777E8B" />
      </g>
    </g>
    <g className="illo2-stack">
      <g>
        <ellipse cx="72.4003" cy="88.9367" rx="33.8384" ry="8.71596" fill="#C0C6CF" />
        <path d="M38.5619 81.2461V89.4493H106.239V81.2461H38.5619Z" fill="#C0C6CF" />
        <ellipse cx="72.4003" cy="80.7335" rx="33.8384" ry="8.71596" fill="#C0C6CF" />
      </g>
      <g>
        <ellipse cx="72.4003" cy="70.0676" rx="33.8384" ry="8.71596" fill="#EAEDF2" />
        <path d="M38.5619 62.3773V70.5806H106.239V62.3773H38.5619Z" fill="#EAEDF2" />
        <ellipse cx="72.4003" cy="61.8644" rx="33.8384" ry="8.71596" fill="white" />
      </g>
      <g>
        <ellipse cx="72.4003" cy="58.1743" rx="33.8384" ry="8.71596" fill="#C0C6CF" />
        <ellipse cx="72.4003" cy="66.3771" rx="33.8384" ry="8.71596" fill="#C0C6CF" />
        <path d="M38.5619 58.6868V66.89H106.239V58.6868H38.5619Z" fill="#C0C6CF" />
      </g>
      <g>
        <ellipse cx="72.4003" cy="47.7559" rx="33.8384" ry="8.71596" fill="#EAEDF2" />
        <path d="M38.5619 40.0654V48.2686H106.239V40.0654H38.5619Z" fill="#EAEDF2" />
        <ellipse cx="72.4003" cy="39.5527" rx="33.8384" ry="8.71596" fill="white" />
      </g>
      <g>
        <ellipse cx="72.4004" cy="43.8189" rx="33.8384" ry="8.71596" fill="#C0C6CF" />
        <ellipse cx="72.4003" cy="35.6152" rx="33.8384" ry="8.71596" fill="#C0C6CF" />
      </g>
      {/* Diagonal-stripe sheen on the top disc — same motif as the corner
          accent, reused as a mask so the highlight only shows through its
          stripes. */}
      <path d="M38.5619 36.1276V44.3308H106.239V36.1276H38.5619Z" fill="#C0C6CF" />
      <mask id="illo2-mask1" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="12" y="0" width="59" height="60">
        <mask id="illo2-mask2" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="11" y="-1" width="60" height="61">
          <path d="M67.4535 58.9997L63.0659 59.0001L11.9994 26.129L11.9994 23.305L67.4535 58.9997ZM70.9995 56.0325L70.9995 58.8575L11.9993 20.8805L11.9994 18.0565L70.9995 56.0325ZM59.2997 58.9997L54.9112 59.0001L11.9995 31.3785L11.9996 28.5544L59.2997 58.9997ZM51.1441 58.9997L46.7565 58.9992L11.9996 36.627L11.9997 33.8029L51.1441 58.9997ZM42.9904 58.9997L38.6018 58.9992L11.9997 41.8755L11.9998 39.0514L42.9904 58.9997ZM34.8347 58.9997L30.4461 58.9992L11.9988 47.125L11.9989 44.3009L34.8347 58.9997ZM26.6801 58.9998L22.2915 58.9992L11.999 52.3745L11.999 49.5495L26.6801 58.9998ZM18.5254 58.9998L14.1378 58.9992L12 57.623L11.9991 54.7989L18.5254 58.9998ZM70.9994 50.784L70.9993 53.6081L11.9992 15.632L11.9993 12.8079L70.9994 50.784ZM70.9993 45.5345L70.9992 48.3586L11.999 10.3826L11.9991 7.55847L70.9993 45.5345ZM70.9992 40.286L70.9991 43.1101L11.9999 5.13305L12 2.30896L70.9992 40.286ZM16.5655 -0.000121176L70.9991 35.0365L70.999 37.8616L12.4079 0.147395L12.4622 -0.000158872L16.5655 -0.000121176ZM24.7211 -0.000173152L70.999 29.788L70.9989 32.6121L20.3335 -0.000735941L24.7211 -0.000173152ZM32.8758 -0.000190041L70.9999 24.5395L70.9998 27.3636L28.4882 -0.00075283L32.8758 -0.000190041ZM41.0305 -0.000206931L70.9997 19.29L70.9997 22.1151L36.6429 -0.000769719L41.0305 -0.000206931ZM49.1842 -0.000188734L70.9996 14.0415L70.9995 16.8656L44.7966 -0.000751522L49.1842 -0.000188734ZM57.3398 -0.000240709L70.9995 8.79201L70.9994 11.6161L52.9522 -0.000803498L57.3398 -0.000240709ZM65.4945 -0.000257599L70.9994 3.54351L70.9993 6.3676L61.1069 -0.000820388L65.4945 -0.000257599ZM71 0.000179494L70.9992 1.11812L69.2616 0.000138655L71 0.000179494Z" fill="black" />
        </mask>
        <g mask="url(#illo2-mask2)">
          <rect x="12.0793" y="0.551514" width="58.8495" height="58.8495" fill="#777E8B" />
        </g>
      </mask>
      <g mask="url(#illo2-mask1)">
        <path d="M106.239 43.8184C106.239 48.6321 91.0888 52.5344 72.4004 52.5344C53.7119 52.5344 38.5619 48.6321 38.5619 43.8184C38.5619 39.0047 38.5619 35.8604 38.5619 35.8604C57.2503 35.8604 106.239 39.0047 106.239 43.8184Z" fill="white" />
        <ellipse cx="72.4003" cy="35.6153" rx="33.8384" ry="8.71596" fill="white" />
      </g>
    </g>
  </>
);

// Formula/Filters/Parameters' own centerpiece — Radiant's OTHER Muted Alert
// template, e.g. "Pinboard" (figma.com/design/1QlRveXx4wppvDXyPVWUTK, node
// 25122:178958): a plain muted circle with the icon knocked out in white
// (here: drawn in white over the circle — same result, since the page behind
// it is white too), a striped-circle accent tucked behind its top edge, and
// the same dot-grid accent as Tables' own illustration, mirrored to the
// opposite corner. 2026-09-25, Komal: "i dont like bottom oval that you have
// added. Simply add the symbol in a round like this" — replaces the earlier
// ground-ellipse-plus-bare-icon attempt. Formula and Filters reuse the exact
// icons already doing this job elsewhere in this prototype — Icon
// 'formula'/'funnel', the same two the spreadsheet toolbar's own Add
// formula/Filter buttons use. Parameters wears Icon 'tag' — the same glyph
// its section header shows, so the two read as one thing (2026-09-25: the
// prototype-local ParameterIcon it used to carry was dropped for the
// registry, per "we should use our icons").
// Geometry below is traced 1:1 from the node's own exported vectors, not
// eyeballed: disc = the "Subtract" layer (81.7803 box at 29.56/18.3, so
// r 40.8896 centred on 70.4496/59.1896); ring = the "Subtract" stripe layer
// (49.8311x49.9551 box at 79.17/0.33, i.e. r 24.97755 centred on
// 104.0856/25.3076, with 3-unit bands on a 7-unit pitch starting at
// y -0.94441); the white bands over the disc are the node's own "Mask Group"
// (same bands, masked to the disc); dots are its four "Group 5" blocks at
// 12.66/35.86 x 74.79/97.6, each a 5x5 grid of r-1.07139 circles.
const RING_BANDS = [-0.94441, 6.05559, 13.05559, 20.05559, 27.05559, 34.05559, 41.05559, 48.05559];
const DOT_COLS = [1.07176, 5.70436, 10.3374, 14.9704, 19.6034];
const DOT_ROWS = [1.07213, 5.70412, 10.3375, 14.9702, 19.2171];
const DOT_BLOCKS = [
  { x: 12.66, y: 74.79 }, { x: 12.66, y: 97.6 },
  { x: 35.86, y: 74.79 }, { x: 35.86, y: 97.6 },
];
const ROUND_CENTERPIECE = (icon: React.ReactNode, id: string) => (
  <>
    <defs>
      {/* The disc, minus the icon — the node ships this as one flattened
          "Subtract" path; punching the icon out with a luminance mask is the
          same result while leaving the glyph swappable, which is the whole
          point here. */}
      <mask id={`${id}-knockout`} maskUnits="userSpaceOnUse" x="29.56" y="18.3" width="81.7803" height="81.7803">
        <circle cx="70.4496" cy="59.1896" r="40.8896" fill="#fff" />
        <g style={{ color: '#000' }} transform="translate(70.4496 59.1896) scale(2.4) translate(-9 -9)">
          {icon}
        </g>
      </mask>
      <clipPath id={`${id}-ring`}>
        <circle cx="104.0856" cy="25.3076" r="24.97755" />
      </clipPath>
      <clipPath id={`${id}-disc`}>
        <circle cx="70.4496" cy="59.1896" r="40.8896" />
      </clipPath>
    </defs>
    {/* Disc, ring and the ring's white run across the disc bob as one piece:
        they interlock (the white bands have to stay registered with both the
        grey ones above them and the disc edge below), so moving any one of
        them on its own would tear the overlap. */}
    <g className="illo2-stack">
      <circle cx="70.4496" cy="59.1896" r="40.8896" fill="#C0C6CF" mask={`url(#${id}-knockout)`} />
      <g clipPath={`url(#${id}-ring)`}>
        {RING_BANDS.map(y => <rect key={y} x="79" y={y} width="51" height="3" fill="#777E8B" />)}
      </g>
      <g clipPath={`url(#${id}-disc)`}>
        <g clipPath={`url(#${id}-ring)`}>
          {RING_BANDS.map(y => <rect key={y} x="79" y={y} width="51" height="3" fill="#fff" />)}
        </g>
      </g>
    </g>
    <g className="illo2-accent-dots" fill="#777E8B">
      {DOT_BLOCKS.map((block, bi) => (
        DOT_COLS.map((cx, ci) => (
          DOT_ROWS.map((cy, ri) => (
            <circle key={`${bi}-${ci}-${ri}`} cx={block.x + cx} cy={block.y + cy} r={1.07139} />
          ))
        ))
      ))}
    </g>
  </>
);
const FORMULA_CENTERPIECE = ROUND_CENTERPIECE(<Icon name="formula" size="l" color="currentColor" />, 'illo-formula');
const FILTER_CENTERPIECE = ROUND_CENTERPIECE(<Icon name="funnel" size="l" color="currentColor" />, 'illo-filter');
const PARAMETER_CENTERPIECE = ROUND_CENTERPIECE(<Icon name="tag" size="l" color="currentColor" />, 'illo-parameter');
const FORMULA_ILLUSTRATION = <MutedAlertIllustration clipId="illo-formula-clip" centerpiece={FORMULA_CENTERPIECE} />;
const FILTER_ILLUSTRATION = <MutedAlertIllustration clipId="illo-filter-clip" centerpiece={FILTER_CENTERPIECE} />;
const PARAMETER_ILLUSTRATION = <MutedAlertIllustration clipId="illo-parameter-clip" centerpiece={PARAMETER_CENTERPIECE} />;

const PanelEmptyState: React.FC<{ illustration: React.ReactNode; title: string; description: string; buttonLabel: string; onAdd: () => void }> = ({ illustration, title, description, buttonLabel, onAdd }) => (
  <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0, padding: 'var(--spacing-6)', textAlign: 'center' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: 'var(--spacing-5)' }}>
      {illustration}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
      <Typography variant="content-label" as="div" noMargin>{title}</Typography>
      <Typography variant="footnote" as="div" color="gray-light" noMargin style={{ maxWidth: 230 }}>
        {description}
      </Typography>
    </div>
    {/* 2026-09-24, Komal: "for formula, filter and parameters, use a
        secondary CTA in the left panel empty states" — PanelEmptyState is
        exclusively these three (Tables keeps its own separate, bespoke
        empty state above), so this one change covers all of them. */}
    <Button variant="secondary" icon="plus" onClick={onAdd} style={{ marginTop: 'var(--spacing-5)' }}>{buttonLabel}</Button>
  </div>
);

// Option 1 adds a Query tab next to Parameters (content built later); Option 2
// is the unmodified original tab set — a review-only comparison, see
// .option-switcher in the header. Option 3 is Option 2 plus the Formula/
// Filters/Parameters dock moved into the Tables left pane (see DockRow
// above), so those tabs drop out of ITS tab set only — Options 1 and 2 keep
// the original full tab list untouched.
const TAB_OPTIONS_BASE = [
  { id: 'tables',     label: 'Tables' },
  { id: 'columns',    label: 'Columns' },
  { id: 'formulas',   label: 'Formulas' },
  { id: 'filters',    label: 'Filters' },
  { id: 'parameters', label: 'Parameters' },
  { id: 'settings',   label: 'Settings' },
];
const TAB_OPTIONS_WITH_QUERY = [
  { id: 'tables',     label: 'Tables' },
  { id: 'columns',    label: 'Columns' },
  { id: 'formulas',   label: 'Formulas' },
  { id: 'filters',    label: 'Filters' },
  { id: 'parameters', label: 'Parameters' },
  { id: 'query',      label: 'Query' },
  { id: 'settings',   label: 'Settings' },
];
const TAB_OPTIONS_OPTION3 = [
  { id: 'tables',     label: 'Tables' },
  { id: 'columns',    label: 'Columns' },
];
// Optimized only — same ids ('tables'/'columns', so the tab-switch wiring is
// untouched), renamed display labels for this branch's sub-header switcher.
// Build/Define → Builder/Semantics (2026-09-22, Komal: "change this to
// Builder, Semantics, Query") — reverts to the original noun labels, third
// pill below renamed to match.
const TAB_OPTIONS_OPTION3_OPTIMIZED = [
  { id: 'tables',  label: 'Builder' },
  { id: 'columns', label: 'Semantics' },
];
// "Split" layout only (see dataModelLayout below) — Builder/Semantics plus a
// third pill for the as-is Query experience (QueryAsIs), labelled Query.
// Additive: the "Combined" layout keeps using TAB_OPTIONS_OPTION3_OPTIMIZED.
const TAB_OPTIONS_SPLIT = [
  ...TAB_OPTIONS_OPTION3_OPTIMIZED,
  { id: 'query-asis', label: 'Query' },
];

const JOIN_OPTIONS = [
  { id: 'inner', label: 'Inner join' },
  { id: 'left',  label: 'Left join' },
  { id: 'right', label: 'Right join' },
  { id: 'cross', label: 'Cross join' },
];

const ZOOM_OPTIONS = [
  { id: '50',  label: '50%' },
  { id: '75',  label: '75%' },
  { id: '100', label: '100%' },
  { id: '125', label: '125%' },
  { id: '150', label: '150%' },
];

const SORT_OPTIONS = [
  { id: 'name-asc',  label: 'Name (A→Z)' },
  { id: 'name-desc', label: 'Name (Z→A)' },
  { id: 'type',      label: 'Sort by type' },
];

// ── Demo model (prototype-only Empty/Demo switch in the left-pane dock) ──────
// "Empty" is the manually-built starting point the prototype has always opened
// on; "Demo" is a finished model, so the editor can be shown with something in
// it without clicking the whole build out first.
//
// Five tables in a star around fact_new_retail_sales. Every join key below is a
// real column of both tables in init-dme.js's DATASOURCE_TABLES — a join on a
// column that doesn't exist would still draw, but the column pane and preview
// panel read the same schema and would disagree with it.
const DEMO_MODEL = {
  tables: [
    { name: 'fact_new_retail_sales', desc: 'Retail sales transactions' },
    { name: 'fact_customer',         desc: 'Registered customer accounts' },
    { name: 'dim_product',           desc: 'Product catalog with pricing and category' },
    { name: 'dim_store',             desc: 'Store locations and regional metadata' },
    { name: 'dim_date',              desc: 'Calendar dimension' },
  ],
  joins: [
    { name: 'Join 1', desc: 'Links sales to customer profiles',      leftTable: 'fact_new_retail_sales', leftCol: 'customer_id', cardinality: 'Many : 1', rightTable: 'fact_customer', rightCol: 'customer_id' },
    { name: 'Join 2', desc: 'Associates sales with product details', leftTable: 'fact_new_retail_sales', leftCol: 'product_id',  cardinality: 'Many : 1', rightTable: 'dim_product',   rightCol: 'product_id' },
    { name: 'Join 3', desc: 'Connects sales to store locations',     leftTable: 'fact_new_retail_sales', leftCol: 'store_id',    cardinality: 'Many : 1', rightTable: 'dim_store',     rightCol: 'store_id' },
    { name: 'Join 4', desc: 'Puts sales on the calendar',            leftTable: 'fact_new_retail_sales', leftCol: 'sale_date',   cardinality: 'Many : 1', rightTable: 'dim_date',      rightCol: 'full_date' },
  ],
  columns: [
    { table: 'fact_new_retail_sales', columns: ['sale_id', 'customer_id', 'product_id', 'store_id', 'sale_date', 'quantity', 'unit_price', 'discount', 'net_amount'] },
    { table: 'fact_customer',         columns: ['customer_id', 'first_name', 'last_name', 'email', 'region', 'segment', 'lifetime_value'] },
    { table: 'dim_product',           columns: ['product_id', 'product_name', 'category', 'sub_category', 'brand', 'unit_price'] },
    { table: 'dim_store',             columns: ['store_id', 'store_name', 'city', 'state', 'region_id'] },
    { table: 'dim_date',              columns: ['date_id', 'full_date', 'month', 'quarter', 'year', 'is_weekend', 'is_holiday'] },
  ],
};

// A named value reused across formulas and filters. Parameters had no state
// before the Demo switch — the dock was hardcoded to a 0 count and its empty
// state — so this is the shape the dock now renders.
type ModelParameter = { name: string; value: string };

// The three dock lists for the Demo state. Every column referenced below is one
// of DEMO_MODEL's own columns, so the demo reads as one coherent model rather
// than a canvas and three unrelated lists.
const DEMO_FORMULAS: FormulaDraft[] = [
  { name: 'Total revenue',       expression: 'SUM(fact_new_retail_sales.net_amount)' },
  { name: 'Average order value', expression: 'SUM(fact_new_retail_sales.net_amount) / COUNT(DISTINCT fact_new_retail_sales.sale_id)' },
  { name: 'Unique customers',    expression: 'COUNT(DISTINCT fact_new_retail_sales.customer_id)' },
];
// Rendered as `col = val` by the Filters dock.
const DEMO_FILTERS: { col: string; val: string }[] = [
  { col: 'segment',    val: 'Enterprise' },  // fact_customer.segment
  { col: 'region',     val: 'West' },        // fact_customer.region
  { col: 'is_holiday', val: 'false' },       // dim_date.is_holiday
];
const DEMO_PARAMETERS: ModelParameter[] = [
  { name: 'Target margin',      value: '35%' },   // used against unit_price / net_amount
  { name: 'Discount threshold', value: '0.15' },  // fact_new_retail_sales.discount
  { name: 'Reporting year',     value: '2026' },  // dim_date.year
];

type ColRow = { col: string; table: string; desc: string; aiCtx: string };
type FormulaRow = { name: string; type: string };

const COL_TABLE_COLUMNS = [
  { key: 'col',    label: 'Column name' },
  { key: 'table',  label: 'Source table name' },
  { key: 'srcCol', label: 'Source column name', render: (_: unknown, row: Record<string, unknown>) => (row as ColRow).col },
  { key: 'desc',   label: 'Description' },
  { key: 'aiCtx',  label: 'AI context' },
];

const SearchDataOnDataModelFinal: React.FC = () => {
  const navigate = useNavigate();
  const [tablesUnselected, setTablesUnselected] = useState(false);
  const [activeTab, setActiveTab] = useState('tables');
  // Option 3 Optimized is the default landing state.
  // FINAL: locked to the chosen design. Typed as the original union (not a
  // literal) so every existing comparison below still compiles untouched —
  // only the selected branches can ever render.
  const tabOption = 3 as 1 | 2 | 3;
  const isOption3 = tabOption === 3;
  const tabOptions = tabOption === 1 ? TAB_OPTIONS_WITH_QUERY : isOption3 ? TAB_OPTIONS_OPTION3 : TAB_OPTIONS_BASE;
  const [ctxOpen, setCtxOpen] = useState(false);
  const [ctxHtml, setCtxHtml] = useState('');
  const [columnRows, setColumnRows] = useState<ColRow[]>([]);
  const [colSearch, setColSearch] = useState('');
  const [selectedColKeys, setSelectedColKeys] = useState<string[]>([]);
  const [formulaRows, setFormulaRows] = useState<FormulaRow[]>([]);
  const [formulaSearch, setFormulaSearch] = useState('');
  // Filters saved to the model from the spreadsheet's "Add filter" flow
  // (checking "Add this filter to this model") — shown in the left-pane
  // Filters dock.
  const [modelFilters, setModelFilters] = useState<{ col: string; val: string }[]>([]);
  const [tableCanvasData, setTableCanvasData] = useState<{ tables: TablePositionData[]; joins: JoinInfo[] }>({ tables: [], joins: [] });
  const [columnTreeData, setColumnTreeData] = useState<ColumnTreeData>({ tables: [], dataSourceTables: [], modelColumns: [] });
  // Data-source selector Option 2 only (see dataSourceSelectorOption below):
  // same ColumnTree component/shape as Semantics uses today, but listing
  // every source table (not just ones already in the model), so Builder and
  // Semantics can show the identical unified list. Derived, not new data —
  // dataSourceTables already holds the full source schema.
  const unifiedTreeData: ColumnTreeData = {
    tables: columnTreeData.dataSourceTables.map(d => ({ name: d.name })),
    dataSourceTables: columnTreeData.dataSourceTables,
    modelColumns: columnTreeData.modelColumns,
  };
  // 2026-09-25, audit item F: the Tables section's search field carried no
  // value/onChange and its sort button no onClick — both looked live and did
  // nothing. Search matches a table by its own name or by any column inside
  // it, the same rule TableColumnBrowserBody's search already uses, so the
  // two searches in this prototype behave identically. Sort offers the same
  // two options as the Data browser's own sort, "modified" likewise falling
  // back to the catalogue's order because the source tables carry a
  // createdDate but no modified timestamp.
  const [tableQuery, setTableQuery] = useState('');
  const [tableSort, setTableSort] = useState<'name' | 'modified'>('name');
  const [tableSortMenuOpen, setTableSortMenuOpen] = useState(false);
  const tableSortBtnRef = useRef<HTMLButtonElement>(null);
  // Reuses the dock searches' own matchesQuery so all four section searches
  // compare the same way; a table matches on its own name or on any of its
  // columns, the rule TableColumnBrowserBody's search already uses.
  const tableMatches = (name: string, columns: string[]) => (
    !tableQuery.trim() || matchesQuery(name, tableQuery) || columns.some(c => matchesQuery(c, tableQuery))
  );
  const byTableSort = <T extends { name: string }>(list: T[]) => (
    tableSort === 'name' ? [...list].sort((a, b) => a.name.localeCompare(b.name)) : list
  );
  // The list the populated Tables section actually renders: the tables on the
  // canvas, matched on their own name or any column already added from them.
  const visibleCanvasTables = byTableSort(
    tableCanvasData.tables.filter(t => tableMatches(t.name, columnTreeData.modelColumns.find(g => g.table === t.name)?.columns ?? []))
  );
  // Same query and sort applied to the full source catalogue, for the
  // Tables-section options that browse every source table rather than the
  // ones already in the model.
  const visibleTreeData: ColumnTreeData = {
    ...unifiedTreeData,
    tables: byTableSort(
      unifiedTreeData.tables.filter(t => tableMatches(t.name, unifiedTreeData.dataSourceTables.find(d => d.name === t.name)?.columns ?? []))
    ),
  };
  // Which tables are actually on the canvas — drives ColumnTree's
  // addedTableNames prop so added tables look distinct in the unified list.
  const addedTableNames = new Set(tableCanvasData.tables.map(t => t.name));
  // Option 2's checkbox column list — bridges to the legacy manual-edit
  // functions in init-dme.js, which also refresh the canvas card counts.
  const handleToggleColumn = (tableName: string, colName: string, checked: boolean) => {
    (window as any)._toggleColumnManually?.(tableName, colName, checked);
  };
  // Competing designs for selecting tables/columns in the left pane.
  // 1 = the existing ColumnTree (chips, chevron, per-column checkboxes) —
  // frozen. 2 = TablePickerV2 (plain text, "+" adds and expands, select-all on
  // the row). Switched from the toggle next to Builder/Semantics.
  const [tableSelectorOption, setTableSelectorOption] = useState<1 | 2>(2);
  // Its switcher is hidden from the UI (2026-09-17, Komal) — Option 2 is the
  // only design now. Everything Option 1 needs (ColumnTree, ColumnTree import,
  // the tableSelectorOption === 1 branch below) is untouched, so bringing it
  // back is just re-adding this SegmentedControl wherever it should live:
  //   <SegmentedControl
  //     options={[{ id: '1', label: 'Option 1' }, { id: '2', label: 'Option 2' }]}
  //     value={String(tableSelectorOption)}
  //     onChange={v => setTableSelectorOption(Number(v) as 1 | 2)}
  //     size="small"
  //   />
  // setTableSelectorOption has no live caller until then; this keeps the
  // setter itself from tripping noUnusedLocals in the meantime.
  void setTableSelectorOption;
  // Selector Option 2's expanded table. Owned here, not in TablePickerV2, so a
  // canvas card's "Add columns" link can expand that table in the left pane.
  const [openTableV2, setOpenTableV2] = useState<string | null>(null);
  // Formulas saved from the Formula Editor. They show in the left pane's
  // Formula dock and as their own category in the preview panel's column
  // selector, on both the Query and Spreadsheet tabs.
  const [modelFormulas, setModelFormulas] = useState<FormulaDraft[]>([]);
  const [formulaEditorOpen, setFormulaEditorOpen] = useState(false);
  // The formula the editor was opened on, and the name it had at that moment —
  // the name is editable, so the save below matches on the original to replace
  // the right row. null = adding a new formula.
  const [editingFormula, setEditingFormula] = useState<FormulaDraft | null>(null);

  const openFormulaEditor = (f: FormulaDraft) => { setEditingFormula(f); setFormulaEditorOpen(true); };
  const deleteFormula = (name: string) => setModelFormulas(prev => prev.filter(x => x.name !== name));
  const copyFormula = (f: FormulaDraft) => setModelFormulas(prev => withCopy(prev, f));
  // Parameters shown in the left pane's Parameters dock.
  const [modelParameters, setModelParameters] = useState<ModelParameter[]>([]);
  const deleteParameter = (name: string) => setModelParameters(prev => prev.filter(x => x.name !== name));
  const copyParameter = (p: ModelParameter) => setModelParameters(prev => withCopy(prev, p));
  // 2026-09-25, Komal: "clicking on 'Add a parameter' and the plus icon
  // should open this popup" — same "+ opens a modal, empty state's own
  // button opens the same modal" wiring formulaEditorOpen already uses.
  const [parameterEditorOpen, setParameterEditorOpen] = useState(false);
  // Prototype-only: 'empty' is the manually-built starting point, 'demo' is the
  // finished five-table model. Switched from the dock footer next to the
  // Option 1/2 selector. See DEMO_MODEL above.
  const [modelState, setModelState] = useState<'empty' | 'demo'>('empty');
  // Prototype-only: which candidate treatment the left panel is wearing —
  // 'box' (bordered cards, the finalized one) or 'tint'. Drives the
  // dock-box/dock-tint class on each wrapper and DockRow's own branch.
  const [paneBalance] = useState<PaneBalance>('box');
  const handleAddTable = (tableName: string) => {
    (window as any)._addTableManually?.(tableName);
  };
  const handleRemoveTable = (tableName: string) => {
    (window as any)._removeTableManually?.(tableName);
  };
  // Tables-section Option 3 (2026-09-22, Komal) — "Available" / "In this
  // model" tabs. Revised (same day): "Add a plus next to tables name.
  // Clicking on the add should add the table to the canvas, and move it
  // under 'In this model'. From the in this model tab, user can add or
  // remove columns." — table-level add is back (TablePickerV2's own "+",
  // unmodified), and columns are added/removed in place once a table is in
  // the model, via the same plain handleToggleColumn Option 1 uses. No
  // auto-remove-on-empty-columns any more — that was part of the earlier,
  // column-driven mechanism this replaces.
  const [option3Tab, setOption3Tab] = useState<'available' | 'inModel'>('available');
  const [option3OpenTable, setOption3OpenTable] = useState<string | null>(null);
  // Tables-section Option 4 (2026-09-22, Komal) — flat table list, no
  // expand/collapse to preview columns. Clicking a table's "+" opens a side
  // panel to the right of this pane (a flex sibling in .content-row, not a
  // modal) listing just that table's columns; nothing is added to the canvas
  // until "Add to model" is clicked there. Cancel/closing discards the draft.
  // The table NAME opens the identical panel too (2026-09-22, Komal: "I
  // should be able to access the columns pane by clicking on the table name
  // as well") — one panel, two entry points, same behavior either way.
  const [option4PanelTable, setOption4PanelTable] = useState<string | null>(null);
  const [option4Draft, setOption4Draft] = useState<string[]>([]);
  const openOption4Panel = (tableName: string) => {
    setOption4PanelTable(tableName);
    setOption4Draft(columnTreeData.modelColumns.find(g => g.table === tableName)?.columns ?? []);
  };
  const closeOption4Panel = () => { setOption4PanelTable(null); setOption4Draft([]); };
  const confirmOption4 = () => {
    if (!option4PanelTable) return;
    (window as any)._addTableManually?.(option4PanelTable);
    option4Draft.forEach(c => (window as any)._toggleColumnManually?.(option4PanelTable, c, true));
    closeOption4Panel();
  };
  // The "..." menu on a canvas card. Anchored to the click point rather than a
  // ref — the button lives inside the shared TableCard, so the ref isn't ours.
  // This is the only way to take a table off the canvas now that the left
  // pane's added rows carry no "−".
  const [tableCardMenu, setTableCardMenu] = useState<{ name: string; x: number; y: number } | null>(null);
  // Edit Join dialog — opened from a card's join handle. `right` is set only
  // when the handle was dragged onto a second card; a plain click leaves it
  // undefined so the dialog asks the user to pick Table 2.
  const [joinDraft, setJoinDraft] = useState<{ left: string; right?: string } | null>(null);
  // Join badge menu — the eye-icon direction only (2026-09-25): Preview first,
  // then the product's existing Edit join / Delete join pair.
  const [joinMenu, setJoinMenu] = useState<{ j: JoinInfo; x: number; y: number } | null>(null);
  const [modelLoading, setModelLoading] = useState<{ visible: boolean; label: string }>({ visible: false, label: '' });
  // Formula/Filters/Parameters dock in the Tables left pane — only one open at a time.
  const [browserDockOpen, setBrowserDockOpen] = useState<string | null>('tables');
  // Exactly one section is always open, and Tables is the one it falls back to
  // (2026-09-22, Komal: "when none of these are expanded, or all of them are
  // collapsed, auto expand the tables section") — an all-collapsed pane was a
  // stack of headers over dead space, and the section that owns the model's
  // contents is the sensible resting state. Collapsing Tables itself keeps it
  // open rather than closing and snapping back, so there is no flicker.
  const toggleDock = (id: string) => setBrowserDockOpen(cur => (cur === id ? 'tables' : id));
  // One query per section rather than one shared: the accordion shows a single
  // section at a time, but a filter should survive visiting another and coming
  // back. Matched against the name the row shows, not its hover detail.
  const [formulaQuery, setFormulaQuery] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [parameterQuery, setParameterQuery] = useState('');
  const visibleFormulas = modelFormulas.filter(f => matchesQuery(f.name, formulaQuery));
  const visibleFilters = modelFilters.filter(f => matchesQuery(f.col, filterQuery));
  const visibleParameters = modelParameters.filter(p => matchesQuery(p.name, parameterQuery));
  // Optimized only: left pane collapse/resize (shared by both Tables and
  // Columns sections, since it's one physical panel — see #left-pane below).
  const [leftPaneCollapsed, setLeftPaneCollapsed] = useState(false);
  const [leftPaneWidth, setLeftPaneWidth] = useState(300);
  const [leftPaneResizing, setLeftPaneResizing] = useState(false);
  const LEFT_PANE_MIN_WIDTH = 220;
  const LEFT_PANE_MAX_WIDTH = 480;
  // Settings dock row (Option 3 optimized) — editable inline.
  const [joinRule, setJoinRule] = useState<'progressive' | 'all'>('progressive');
  const [disableRowLevelSecurity, setDisableRowLevelSecurity] = useState(false);
  const [turnOffRecommendations, setTurnOffRecommendations] = useState(false);
  // Zoom dropdown (sub-header, top right) — decorative, same as the Select it
  // replaces (no real canvas zoom is wired up either way).
  const [zoomMenuOpen, setZoomMenuOpen] = useState(false);
  const zoomMenuBtnRef = useRef<HTMLButtonElement>(null);
  // Tables-section left-nav redesign (2026-09-21, Komal) — 4 options to try,
  // option 1 being the current design. Switcher only for now; picking 2/3/4
  // does nothing until she asks for those designs to be built.
  // Lands on 2.1 (2026-09-22, Komal: "make these the default when I land on
  // the canvas") — the inline side-panel picker. Option 1 is still one click
  // away in the Options menu.
  const [tablesNavOption, setTablesNavOption] = useState<1 | 2 | 2.1 | 3 | 4>(2.1);
  const [tablesNavMenuOpen, setTablesNavMenuOpen] = useState(false);
  const tablesNavMenuBtnRef = useRef<HTMLButtonElement>(null);
  // Comparing two places to surface the table info card (2026-09-22, Komal:
  // "let's try 1 and 3") — 'icon' puts an info-circle on each row in "Add
  // tables and columns" (opens a popover); 'tab' adds an Info tab next to
  // Columns in that same panel's right pane. Defaults to 'tab' (2026-09-22,
  // Komal: "make side panel tab the default").
  // 'footer' (2026-09-23, Komal: "add a third option... bring the CTAs back
  // at the bottom... dynamic — Add to model / Update") reuses the row-icon
  // info card, and additionally switches the side panel from its free-flowing
  // live-write back to the same staged draft + confirm flow the pop-up modal
  // (Option 2) already uses, so there's something for Cancel/the primary
  // button to act on. See the side-panel call site for the draft wiring.
  // Defaults to 'footer' (2026-09-24, Komal: "make footer CTAs the default").
  const [tableInfoMode, setTableInfoMode] = useState<'icon' | 'tab' | 'footer'>('footer');
  // Canvas and preview panel interactivity (2026-09-23, Komal: "Option 1 is
  // the current design. Option 2 is what we will build and I'll tell you
  // what to build") — switcher only for now; Option 2 has no behavior yet.
  const [canvasPreviewOption, setCanvasPreviewOption] = useState<1 | 2>(1);
  // "In this model should be the first default tab, and available second...
  // land them on available, until they have added tables" (2026-09-22,
  // Komal) — landing default depends on whether the model already has
  // tables the moment this view is switched into, not on every add/remove
  // afterward (that would fight the user's own tab choice while working).
  useEffect(() => {
    if (tablesNavOption === 3) setOption3Tab(addedTableNames.size === 0 ? 'available' : 'inModel');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tablesNavOption]);

  // Tables-section Option 2 (2026-09-21, Komal) — starts empty; a pop-up
  // table browser is the only way in. `option2Draft` is the picker's own
  // staged selection (same shape as columnTreeData.modelColumns) — nothing
  // in the real model changes until "Add to model" is clicked, so browsing
  // and re-browsing costs nothing.
  const [option2ModalOpen, setOption2ModalOpen] = useState(false);
  const [option2Draft, setOption2Draft] = useState<{ table: string; columns: string[] }[]>([]);
  // Snapshot of the draft at the moment the picker opened (2026-09-24, Komal:
  // "the CTA should remain disabled until a change is made when user clicks
  // on edit") — option2HasChanges below diffs against this rather than
  // against columnTreeData.modelColumns live, so a change and then its own
  // undo (re-check a box you just unchecked) correctly returns the button to
  // disabled, not just "not empty".
  const [option2DraftBaseline, setOption2DraftBaseline] = useState<{ table: string; columns: string[] }[]>([]);
  // Which added table is expanded in the populated nav list — one at a time,
  // same as TablePickerV2 (Option 2 takes its row style from there, not from
  // the drag-oriented ColumnTree: "why are they in pills? take inspiration
  // from option 1" (2026-09-21). Nothing here is draggable — these tables are
  // already on the canvas, and removal is the "..." menu only.
  const [option2OpenTable, setOption2OpenTable] = useState<string | null>(null);
  // Which table the picker should land on (2026-09-22, Komal: "world class
  // UX... getting in and out of edit mode") — set when a specific row's own
  // "edit" trigger opened the modal, so it jumps straight there instead of
  // always landing on the catalog's first table. Left null from the section
  // header's own "+", which has no specific table in mind.
  const [option2FocusTable, setOption2FocusTable] = useState<string | null>(null);
  // The empty-state illustration's loop is an attention-getter, and it has
  // done its job the moment the picker is opened (2026-09-22, Komal: "the
  // animation in this should stop once the user clicks on 'Add tables'. Post
  // that, it becomes distraction"). One-way latch: it never restarts.
  const [option2IlloPaused, setOption2IlloPaused] = useState(false);
  const openOption2Modal = () => {
    setOption2IlloPaused(true);
    const snapshot = columnTreeData.modelColumns.map(g => ({ table: g.table, columns: [...g.columns] }));
    setOption2Draft(snapshot);
    setOption2DraftBaseline(snapshot);
    setOption2FocusTable(null);
    setOption2ModalOpen(true);
  };
  const openOption2ModalFor = (tableName: string) => {
    setOption2IlloPaused(true);
    const snapshot = columnTreeData.modelColumns.map(g => ({ table: g.table, columns: [...g.columns] }));
    setOption2Draft(snapshot);
    setOption2DraftBaseline(snapshot);
    setOption2FocusTable(tableName);
    setOption2ModalOpen(true);
  };
  // Set-based, not array-order (2026-09-21, Komal: toggling in TableColumnBrowserBody's
  // right pane can append columns in any order) — two draft groups with the
  // same columns in a different order must still read as "no change".
  // Tables with zero columns are dropped before comparing, matching
  // handleOption2Confirm's own treatment of an empty group as absent.
  const draftSignature = (d: { table: string; columns: string[] }[]) =>
    d.filter(g => g.columns.length > 0)
      .map(g => `${g.table}:${[...g.columns].sort().join(',')}`)
      .sort()
      .join('|');
  const option2HasChanges = draftSignature(option2Draft) !== draftSignature(option2DraftBaseline);
  const handleOption2DraftToggle = (tableName: string, colName: string, checked: boolean) => {
    setOption2Draft(prev => {
      const idx = prev.findIndex(g => g.table === tableName);
      if (checked) {
        if (idx === -1) return [...prev, { table: tableName, columns: [colName] }];
        if (prev[idx].columns.includes(colName)) return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], columns: [...next[idx].columns, colName] };
        return next;
      }
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], columns: next[idx].columns.filter(c => c !== colName) };
      return next;
    });
  };
  // Reconciles the draft against the real model in one pass: tables that lost
  // every column get fully removed (canvas card and all), newly-checked
  // tables get added, and each remaining table's columns are diffed against
  // what's already there — same bridges Option 1's "+"/checkboxes use, just
  // called once per difference instead of live per click.
  const handleOption2Confirm = () => {
    const prevTables = new Set(tableCanvasData.tables.map(t => t.name));
    const prevColumns = columnTreeData.modelColumns;
    const draftTables = new Set(option2Draft.filter(g => g.columns.length > 0).map(g => g.table));
    prevTables.forEach(t => { if (!draftTables.has(t)) (window as any)._removeTableManually?.(t); });
    draftTables.forEach(t => { if (!prevTables.has(t)) (window as any)._addTableManually?.(t); });
    option2Draft.forEach(g => {
      if (g.columns.length === 0) return;
      const prevGroup = prevColumns.find(p => p.table === g.table);
      const prevCols = new Set(prevGroup?.columns ?? []);
      const draftCols = new Set(g.columns);
      draftCols.forEach(c => { if (!prevCols.has(c)) (window as any)._toggleColumnManually?.(g.table, c, true); });
      prevCols.forEach(c => { if (!draftCols.has(c)) (window as any)._toggleColumnManually?.(g.table, c, false); });
    });
    // Closes the loop on the way out too: if a specific table's own "edit"
    // trigger opened the modal, land back on that table already expanded in
    // the nav list, showing exactly what just changed — no extra click to
    // re-expand it (2026-09-22, Komal: "getting in and out of edit mode").
    if (option2FocusTable && draftTables.has(option2FocusTable)) setOption2OpenTable(option2FocusTable);
    setOption2ModalOpen(false);
  };

  // Option 2.1 only (2026-09-22, Komal: "remove the 'add to model' and
  // cancel from the bottom. It should be free flowing selection") — no
  // staged draft, no confirm step: every checkbox click writes straight to
  // the real model via the same bridges Option 1's checkboxes use
  // (handleToggleColumn above), plus the add/remove-table half Option 2
  // needs that Option 1 doesn't, since here a table isn't on the canvas at
  // all until its first column is picked. `remaining` is read from the live
  // model BEFORE the toggle, so unchecking a table's last column is
  // detected in the same click that removes it, rather than a stale read
  // after the state update.
  const handleOption2LiveToggle = (tableName: string, colName: string, checked: boolean) => {
    if (checked) {
      (window as any)._addTableManually?.(tableName);
      (window as any)._toggleColumnManually?.(tableName, colName, true);
      return;
    }
    const remaining = (columnTreeData.modelColumns.find(g => g.table === tableName)?.columns ?? []).filter(c => c !== colName);
    (window as any)._toggleColumnManually?.(tableName, colName, false);
    if (remaining.length === 0) (window as any)._removeTableManually?.(tableName);
  };
  // Replaces handleOption2Confirm's own end-of-flow step for this panel:
  // land back on the edited table already expanded in the nav list, read
  // from the live model at the moment of closing rather than a draft.
  const closeOption2Panel = () => {
    if (option2FocusTable && (columnTreeData.modelColumns.find(g => g.table === option2FocusTable)?.columns.length ?? 0) > 0) {
      setOption2OpenTable(option2FocusTable);
    }
    setOption2ModalOpen(false);
  };

  // Option 2's bottom preview/query panel on the Tables tab (see .option-switcher above).
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFull, setPreviewFull] = useState(false);
  const [previewHeight, setPreviewHeight] = useState(280);
  // Default 'preview' (Option 2). Option 3 defaults to 'query' instead —
  // see the effect below, scoped to tabOption === 3 only.
  const [panelTab, setPanelTab] = useState<'preview' | 'query'>('preview');
  // 'join' is Option 3 only — Option 2 never sets it (its TableCanvas isn't
  // wired with onSelectJoin), so this widening is safe for it.
  // Starts at 'model' so opening the panel before anything is selected lists
  // every column on the canvas — 'table' with no selected table scopes to
  // nothing now that both panel tabs respect the scope.
  // 'none' = nothing picked yet, added 2026-09-22 with Split's title-bar scope
  // switcher: 'model' used to double as "nothing selected", and once Model
  // became a real choice in that menu the two had to be told apart. Combined
  // never sees 'none' — it is mapped back to 'model' at its own call sites, so
  // it still lands on the whole model exactly as before.
  // Starts at 'none' to match direction 4's home (nothing selected until a
  // card is clicked) — 2026-09-24, Vivek: default to select-to-preview.
  // Combined still lands on 'model' via the mapping above.
  const [previewScope, setPreviewScope] = useState<'none' | 'table' | 'join' | 'model'>('none');
  const [previewTable, setPreviewTable] = useState('');
  const [previewJoin, setPreviewJoin] = useState<JoinInfo | null>(null);
  // ── Preview interaction directions (2026-09-23, see preview-interaction-plan.html) ──
  // Split layout only; Combined keeps its existing behavior throughout.
  // 1 · Select to preview — home is Nothing; background click → 'none';
  //     Model CTA on canvas + dropdown. (≈ the 21 Sep shipped behavior.)
  // 2 · Model is home — grid defaults to the model; clicking drills
  //     in; background click zooms back out to 'model'; no Model CTA.
  // 3 · Explicit preview — selection only highlights (selTable/selJoin below,
  //     decoupled from preview); preview icons on cards/joins + the Model CTA
  //     are the only preview triggers. (DEFAULT since 2026-09-25, design
  //     review: "We're going with the eye icon" / Vivek: "data should not
  //     change when I click on card, eye is the icon to preview data". Join
  //     badges open a Preview/Edit/Delete menu in this direction.)
  // 4 · Select to preview WITHOUT icons (2026-09-24) — direction 1's exact
  //     behavior, minus the eye icons: the card/join click itself is the
  //     trigger, plus the Preview-model CTA and dropdown. (Was the default
  //     24 Sep; the 25 Sep design review picked the eye icons instead.)
  const [previewDirection, setPreviewDirection] = useState<1 | 2 | 3 | 4>(3);
  const previewDirectionRef = useRef(previewDirection);
  previewDirectionRef.current = previewDirection;
  // The two mental models bake their refresh in (Vivek, 2026-09-23: "these
  // are 2 mental models"): Model-is-home refreshes automatically (auto +
  // cached returns); select-explicitly refreshes on a click ('explicit' +
  // fresh loads). See the previewBehavior prop below. Direction 3 (the
  // icons-only explicit variant) stays built but off the menu; likewise
  // secondDoorIcons — flip to true to demo preview icons in Model-is-home.
  const secondDoorIcons = false;
  // Direction 3 only: canvas highlight, decoupled from what the panel previews.
  const [selTable, setSelTable] = useState('');
  const [selJoin, setSelJoin] = useState<JoinInfo | null>(null);
  // A previewed join that gets deleted leaves the preview with nothing to
  // show, so the scope drops to 'none' and the canvas selection clears —
  // rather than holding the dead join's name in the scope switcher
  // (2026-09-25, Vivek: "when a join is deleted but was being previewed,
  // nothing should be left selected afterward"). Watches the canvas joins
  // rather than hooking the delete handler, so every deletion path is
  // covered.
  useEffect(() => {
    if (previewScope !== 'join' || !previewJoin) return;
    const stillThere = tableCanvasData.joins.some(j => joinKey(j) === joinKey(previewJoin));
    if (stillThere) return;
    setPreviewJoin(null);
    setPreviewTable('');
    setPreviewScope('none');
    setSelJoin(null);
    setSelTable('');
  }, [tableCanvasData.joins, previewScope, previewJoin]);
  // Switching directions resets to that direction's home with nothing selected.
  const applyPreviewDirection = (d: 1 | 2 | 3 | 4) => {
    setPreviewDirection(d);
    setPreviewTable(''); setPreviewJoin(null);
    setSelTable(''); setSelJoin(null);
    setPreviewScope(d === 2 ? 'model' : 'none');
  };
  // Split only (2026-09-24, Vivek): where a formula/filter born on the preview
  // grid lands. 'direct' (his default: "users will not intuitively understand"
  // a promote step inside the model editor) — every creation writes to the
  // model as it commits. 'promote' (the team wants to see it) — the creation
  // stays a preview-local draft until its "Add to model" checkbox is ticked,
  // in the creation flow itself or later from the fx column's ▾ menu / fx bar.
  // Default is the draft-then-promote journey (2026-09-25, Vivek: "draft in
  // promote should be default in this") — it was 'direct' when that option
  // was his working position on 24 Sep.
  const [creationMode, setCreationMode] = useState<'direct' | 'promote'>('promote');
  // A left-panel Filters row's Edit asking the preview grid to open its
  // Add-filter modal on that filter (nonce so re-edits fire). Also opens the
  // panel — the modal lives inside it.
  const [filterEditReq, setFilterEditReq] = useState<{ col: string; n: number } | null>(null);
  const requestFilterEdit = (col: string) => { setFilterEditReq({ col, n: Date.now() }); setPreviewOpen(true); };
  // Spreadsheet artifacts not yet in the model, reported up by the preview
  // grid — the save-review modal's inventory (2026-09-25, Vivek: "when user
  // clicks on save, I want users to have a way to review all actions done
  // from spreadsheet").
  const [sheetDrafts, setSheetDrafts] = useState<{ formulas: { name: string; expression: string }[]; filters: { col: string; val: string }[] }>({ formulas: [], filters: [] });
  const [saveReviewOpen, setSaveReviewOpen] = useState(false);
  const [saveModelName, setSaveModelName] = useState('Retail Sales Analytics');
  const [saveModelDesc, setSaveModelDesc] = useState('');
  const [saveChecks, setSaveChecks] = useState<Record<string, boolean>>({});
  const openSaveReview = () => {
    setSaveChecks(Object.fromEntries([
      ...sheetDrafts.filters.map(f => [`f:${f.col}`, true] as const),
      ...sheetDrafts.formulas.map(x => [`x:${x.name}`, true] as const),
    ]));
    setSaveReviewOpen(true);
  };
  // Explicit preview actions (direction 3's icons/CTA, and direction 2's
  // second-door icons): preview implies selection, so icon and highlight
  // never disagree. Also the one selection-ish action that opens a closed
  // panel — an explicit ask to see data, unlike a plain canvas click.
  const previewTableExplicit = (name: string) => {
    setSelTable(name); setSelJoin(null);
    setPreviewTable(name); setPreviewJoin(null);
    setPreviewScope('table');
    setPreviewOpen(true);
  };
  const previewJoinExplicit = (j: JoinInfo) => {
    setSelJoin(j); setSelTable('');
    setPreviewJoin(j); setPreviewTable('');
    setPreviewScope('join');
    setPreviewOpen(true);
  };
  // Option 3 only: switches PreviewPanel3 between embedding SearchDataExplorations
  // completely as-is vs. optimized for the docked panel (see .option-switcher below).
  const option3EmbedMode = 'optimized' as 'asis' | 'optimized';
  // Option 3 "optimized" only: two competing designs for the left panel's
  // Tables/Columns data-source selector. Option 1 = existing pattern (the
  // current SegmentedControl in the sub-header, untouched). Option 2 = new
  // design (2026-09-10), built out only where dataSourceSelectorOption === 2
  // is checked. Unrelated to the outer tabOption 1-4 numbering above — this
  // is its own independent switcher, scoped entirely to Option 3 optimized.
  // Defaults to 2 (2026-09-10) — Option 2 is now the landing-state default.
  const dataSourceSelectorOption = 2 as 1 | 2;
  // "Combined" (default) is today's experience, untouched: Builder/Semantics
  // only, bottom panel keeps Query+Spreadsheet together (PreviewPanel3).
  // "Split" adds a third Query pill (TAB_OPTIONS_SPLIT) that renders the as-is
  // QueryAsIs component full-pane, and the bottom panel shows only the
  // Spreadsheet (see PreviewPanel3's hideQueryTab prop below).
  // Split is the landing layout (2026-09-22, Komal: "make these the default
  // when I land on the canvas"); Combined is still in the Options menu.
  const [dataModelLayout, setDataModelLayout] = useState<'combined' | 'split'>('split');

  const [spotterModelEnabled] = useState<boolean>(() => (window as any).__DME_CONFIG__?.spotterModel ?? true);
  const [welcomeVariant] = useState<'blank' | 'existing'>(() => (window as any).__DME_CONFIG__?.welcomeVariant ?? 'blank');
  const [agentPanelCollapsed, setAgentPanelCollapsed] = useState(false);

  // 2026-09-25, Komal: "this should be Untitled model, clicking on it should
  // make the name editable" — was a static placeholder string; now real
  // state with a click-to-edit affordance (see the sub-header render below).
  const [modelName, setModelName] = useState(() => welcomeVariant === 'blank' ? 'Untitled model' : 'Retail Sales Analytics');
  const [editingModelName, setEditingModelName] = useState(false);
  const [modelNameDraft, setModelNameDraft] = useState(modelName);
  const modelDesc = welcomeVariant === 'blank' ? 'Add description' : 'Sales performance model for Spotter AI search';

  const handleTabChange = (tabId: string) => {
    // Collapsed by default on landing (2026-09-24, Komal: "by default, the
    // left panel should be collapsed when the user lands on Query. They can
    // expand it on demand") — Query's own data panel (Measures/Attributes/…)
    // already covers the same ground the Tables/Formula/etc. dock does, so
    // leaving the dock open by default just eats width twice over.
    // leftPaneCollapsed is one shared boolean for the whole pane, not a
    // per-tab value, so each side of the Builder/Semantics <-> Query
    // boundary re-asserts its OWN default the moment it's entered — Query
    // collapses, Builder/Semantics re-opens — rather than one tab's manual
    // toggle silently carrying over and stranding the other in the wrong
    // state (caught in testing: expanding it on Query, then leaving, left
    // Builder collapsed too). Both checks compare against the PREVIOUS
    // activeTab (before setActiveTab below updates it), so a manual toggle
    // made WHILE already on a tab is never fought — only a fresh landing
    // re-applies that tab's default.
    if (tabId === 'query-asis' && activeTab !== 'query-asis') setLeftPaneCollapsed(true);
    else if ((tabId === 'tables' || tabId === 'columns') && activeTab === 'query-asis') setLeftPaneCollapsed(false);
    setActiveTab(tabId);
    const pill = document.querySelector<HTMLElement>(`.tab-pill[data-tab="${tabId}"]`);
    pill?.click();
  };

  // Option 3 "As is": Query is the default tab in the preview/query panel.
  // Option 3 Optimized defaults to Preview/Spreadsheet instead (and is first
  // in its own tab order — see PreviewPanel3Optimized). Option 2 keeps
  // defaulting to Preview/Spreadsheet via the initial panelTab state above.
  useEffect(() => {
    if (tabOption === 3) setPanelTab(option3EmbedMode === 'asis' ? 'query' : 'preview');
  }, [tabOption, option3EmbedMode]);

  // Optimized only: expanding the preview panel auto-collapses the left
  // tables/columns panel and the SpotterModel panel, so the expanded preview
  // gets the full width. Split only (2026-09-22, Komal): "when you expand and
  // collapse the data preview panel, do not auto collapse the left panel and
  // the spottermodel" — Combined keeps the original auto-collapse behavior.
  useEffect(() => {
    if (previewOpen && tabOption === 3 && option3EmbedMode === 'optimized' && dataModelLayout === 'combined') {
      setLeftPaneCollapsed(true);
      setAgentPanelCollapsed(true);
    }
  }, [previewOpen, tabOption, option3EmbedMode, dataModelLayout]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    (window as any)._openCtxModal  = (html: string) => { setCtxHtml(html); setCtxOpen(true); };
    (window as any)._closeCtxModal = () => setCtxOpen(false);
    (window as any)._setColumnRows = (rows: ColRow[]) => { setColumnRows(rows); setColSearch(''); setSelectedColKeys([]); };
    (window as any)._setFormulaRows = (rows: FormulaRow[]) => { setFormulaRows(rows); setFormulaSearch(''); };
    (window as any)._addModelFilter = (f: { col: string; val: string }) => setModelFilters(prev => [...prev.filter(x => x.col !== f.col), f]);
    (window as any)._setTableCanvasData = (data: { tables: TablePositionData[]; joins: JoinInfo[] }) => setTableCanvasData(data);
    (window as any)._setColumnTreeData  = (data: ColumnTreeData) => setColumnTreeData(data);
    (window as any)._setModelLoading    = (visible: boolean, label?: string) => setModelLoading({ visible, label: label ?? '' });

    const cleanup = initDME();
    return () => {
      document.body.style.overflow = prev;
      cleanup?.();
      delete (window as any)._openCtxModal;
      delete (window as any)._closeCtxModal;
      delete (window as any)._setColumnRows;
      delete (window as any)._setFormulaRows;
      delete (window as any)._addModelFilter;
      delete (window as any)._setTableCanvasData;
      delete (window as any)._setColumnTreeData;
      delete (window as any)._setModelLoading;
    };
  }, []);

  // Applies the Empty/Demo switch. Runs after the mount effect above (so
  // initDME has installed _loadDemoModel/_resetModel and the React setters the
  // rebuilds call back into), and again on every flip of the switch. The dock
  // lists are React state, the canvas is init-dme.js's — both have to move
  // together or the switch would half-apply.
  useEffect(() => {
    if (modelState === 'demo') {
      (window as any)._loadDemoModel?.({ ...DEMO_MODEL, formulas: DEMO_FORMULAS });
      setModelFormulas(DEMO_FORMULAS);
      setModelFilters(DEMO_FILTERS);
      setModelParameters(DEMO_PARAMETERS);
    } else {
      (window as any)._resetModel?.();
      setModelFormulas([]);
      setModelFilters([]);
      setModelParameters([]);
    }
    // Whichever way it went, the previous model's selections are gone — reset
    // to the active direction's home ('model' for direction 2, 'none' for
    // 1/3). Read through the ref so this effect stays keyed on modelState
    // alone and a direction switch doesn't re-run the demo/empty rebuild.
    setOpenTableV2(null);
    setPreviewTable('');
    setPreviewJoin(null);
    setSelTable('');
    setSelJoin(null);
    setPreviewScope(previewDirectionRef.current === 2 ? 'model' : 'none');
  }, [modelState]);

  // Settings dock body — inline-editable join rule + security options.
  // Control labels are rendered as our own <span> (showLabel={false}) because the
  // DS Radio/Checkbox/Toggle label is white-space: nowrap, which truncates in
  // this narrow dock. Typography/Divider/spacing tokens otherwise come from the DS.
  // 2026-09-25, Komal: "significantly improve the UI of this by using the
  // right fonts, font colors, grouping and spacing". Three things were doing
  // the damage: every gap in the panel was the same spacing-2, so a heading
  // sat as far from its own content as that content sat from the next
  // section; every line was content-primary, so a heading, a choosable label
  // and helper text all carried the same weight of voice; and the section
  // rules were doing the grouping that spacing should have been doing.
  //
  // Now: a heading hugs its own helper line (spacing-1) and its control group
  // sits clearly below it (spacing-3), sections are separated by spacing-6 of
  // air instead of a rule, and helper text drops to gray-light so the eye
  // sorts heading / label / explanation without reading a word.
  const settingsRowLabel = (text: string, onToggle: () => void) => (
    <Typography variant="footnote" as="span" onClick={onToggle} style={{ cursor: 'pointer' }}>
      {text}
    </Typography>
  );
  const settingsHelpText = (text: string, style?: React.CSSProperties) => (
    <Typography variant="caption" as="div" color="gray-light" style={style}>{text}</Typography>
  );
  const settingsSectionHeading = (text: string) => (
    <Typography variant="content-label-subhead" as="div">{text}</Typography>
  );
  const settingsSection = (children: React.ReactNode) => (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>{children}</section>
  );

  // The prototype's own switchers (model state / layout / tables-section
  // option). Lived in the app header until 2026-09-22, when Komal asked to
  // "move options inside the settings panel at the bottom so it's not visible
  // upfront" — they are a reviewing aid, not part of the product surface, and
  // the header is the first thing anyone looks at. Same state and same menu,
  // just anchored from the Settings section now. AnchoredMenu flips and clamps
  // to the viewport on its own, so sitting at the bottom of a scrollable dock
  // is fine.
  // Reviewing-aid flags — flip either back to true to restore that menu
  // group exactly as it was; nothing else about the hidden options was
  // touched, they're just unreachable with no menu item left to pick them.
  // SHOW_LAYOUT_SWITCHER (2026-09-24, Komal: "finalize split and hide
  // combined in a way i can bring it back when needed") drops the whole
  // "Layout" group — dataModelLayout already defaults to 'split'.
  // SHOW_ALL_TABLES_OPTIONS (2026-09-24, Komal: "hide options 1, 3 and 4")
  // narrows "Tables section" down to 2 and 2.1 — tablesNavOption already
  // defaults to 2.1. SHOW_TABLE_INFO_MODE_SWITCHER (2026-09-24, Komal:
  // "finalize footer CTA as the final option") drops the whole "Table info
  // panel" group — tableInfoMode already defaults to 'footer'.
  // SHOW_TABLES_OPTION_2 (2026-09-25, Komal: "hide option 2 and default it to
  // option 2.1") narrows "Tables section" down to just 2.1 — tablesNavOption
  // already defaults to 2.1.
  // SHOW_TABLES_OPTION_21 (2026-09-25, Komal: "remove [Option 2.1]") hides the
  // last remaining item — Tables section group disappears entirely. Flip back
  // to true to restore it.
  const SHOW_LAYOUT_SWITCHER = false;
  const SHOW_ALL_TABLES_OPTIONS = false;
  const SHOW_TABLES_OPTION_2 = false;
  const SHOW_TABLES_OPTION_21 = false;
  const SHOW_TABLE_INFO_MODE_SWITCHER = false;

  const optionsMenu = (
    <div style={{ position: 'relative' }}>
      <Button
        ref={tablesNavMenuBtnRef}
        variant="tertiary"
        size="basic"
        iconPosition="trailing"
        icon={<Icon name={tablesNavMenuOpen ? 'chevron-up' : 'chevron-down'} size="s" color="var(--rd-sys-color-content-secondary)" />}
        onClick={() => setTablesNavMenuOpen(o => !o)}
        style={{ border: '1px solid var(--rd-sys-color-border-default)', borderRadius: 'var(--radius-lg)', color: 'var(--rd-sys-color-content-primary)', background: 'var(--rd-sys-color-background-base)' }}
      >
        Options
      </Button>
      <AnchoredMenu
        open={tablesNavMenuOpen}
        anchorRef={tablesNavMenuBtnRef}
        onClose={() => setTablesNavMenuOpen(false)}
        placement="bottom-start"
      >
        <Menu onClose={() => setTablesNavMenuOpen(false)}>
          <Menu.Group label="Model state">
            <Menu.Item active={modelState === 'empty'} onClick={() => { setModelState('empty'); setTablesNavMenuOpen(false); }}>Empty</Menu.Item>
            <Menu.Item active={modelState === 'demo'} onClick={() => { setModelState('demo'); setTablesNavMenuOpen(false); }}>Demo</Menu.Item>
          </Menu.Group>
          <Menu.Divider />
          {/* Split is finalized (2026-09-24, Komal: "finalize split and hide
              combined in a way i can bring it back when needed") — the
              switcher is gone from the menu, but nothing about Combined
              itself was touched: dataModelLayout already defaults to
              'split', and every dataModelLayout === 'combined' branch
              elsewhere is still there, just unreachable with no menu item
              left to set it. Flip SHOW_LAYOUT_SWITCHER back to true to
              restore this group exactly as it was. */}
          {SHOW_LAYOUT_SWITCHER && (
            <>
              <Menu.Group label="Layout">
                <Menu.Item active={dataModelLayout === 'combined'} onClick={() => { setDataModelLayout('combined'); setTablesNavMenuOpen(false); }}>Combined</Menu.Item>
                <Menu.Item active={dataModelLayout === 'split'} onClick={() => { setDataModelLayout('split'); setTablesNavMenuOpen(false); }}>Split</Menu.Item>
              </Menu.Group>
              <Menu.Divider />
            </>
          )}
          {/* 2026-09-24, Komal: "hide options 1, 3 and 4" — narrowed to the
              two live candidates (tablesNavOption already defaults to 2.1).
              Flip SHOW_ALL_TABLES_OPTIONS back to true to bring the other
              three back exactly as they were. */}
          {(SHOW_ALL_TABLES_OPTIONS || SHOW_TABLES_OPTION_2 || SHOW_TABLES_OPTION_21) && (
            <Menu.Group label="Tables section">
              {SHOW_ALL_TABLES_OPTIONS && (
                <Menu.Item active={tablesNavOption === 1} onClick={() => { setTablesNavOption(1); setTablesNavMenuOpen(false); }}>Option 1</Menu.Item>
              )}
              {SHOW_TABLES_OPTION_2 && (
                <Menu.Item active={tablesNavOption === 2} onClick={() => { setTablesNavOption(2); setTablesNavMenuOpen(false); }}>Option 2</Menu.Item>
              )}
              {SHOW_TABLES_OPTION_21 && (
                <Menu.Item active={tablesNavOption === 2.1} onClick={() => { setTablesNavOption(2.1); setTablesNavMenuOpen(false); }}>Option 2.1</Menu.Item>
              )}
              {SHOW_ALL_TABLES_OPTIONS && (
                <>
                  <Menu.Item active={tablesNavOption === 3} onClick={() => { setTablesNavOption(3); setTablesNavMenuOpen(false); }}>Option 3</Menu.Item>
                  <Menu.Item active={tablesNavOption === 4} onClick={() => { setTablesNavOption(4); setTablesNavMenuOpen(false); }}>Option 4</Menu.Item>
                </>
              )}
            </Menu.Group>
          )}
          {/* 2026-09-24, Komal: "finalize footer CTA as the final option" —
              tableInfoMode already defaults to 'footer'; flip
              SHOW_TABLE_INFO_MODE_SWITCHER back to true to bring the other
              two candidates (Row icon / Side panel tab) back exactly as
              they were. */}
          {SHOW_TABLE_INFO_MODE_SWITCHER && (
            <>
              <Menu.Divider />
              <Menu.Group label="Table info panel">
                <Menu.Item active={tableInfoMode === 'icon'} onClick={() => { setTableInfoMode('icon'); setTablesNavMenuOpen(false); }}>Row icon</Menu.Item>
                <Menu.Item active={tableInfoMode === 'tab'} onClick={() => { setTableInfoMode('tab'); setTablesNavMenuOpen(false); }}>Side panel tab</Menu.Item>
                <Menu.Item active={tableInfoMode === 'footer'} onClick={() => { setTableInfoMode('footer'); setTablesNavMenuOpen(false); }}>Footer CTAs</Menu.Item>
              </Menu.Group>
            </>
          )}
          <Menu.Divider />
          <Menu.Group label="Canvas and preview interactivity">
            <Menu.Item active={canvasPreviewOption === 1} onClick={() => { setCanvasPreviewOption(1); setTablesNavMenuOpen(false); }}>Option 1</Menu.Item>
            <Menu.Item active={canvasPreviewOption === 2} onClick={() => { setCanvasPreviewOption(2); setTablesNavMenuOpen(false); }}>Option 2</Menu.Item>
          </Menu.Group>
          {/* Preview interaction directions (Split only) — see
              preview-interaction-plan.html. Direction 2's sub-knobs render
              only while it's the active direction. Menu stays open on these
              so the sub-knobs can be set in one visit. */}
          <Menu.Divider />
          {/* Only the settled default of each group is on the menu now
              (2026-09-25, Vivek: "hide the unselected option from here, only
              keep defaults — if needed we'll bring them back later"). Every
              alternative stays FULLY BUILT and reachable by re-adding its row
              here; nothing below this menu was removed.
                Data preview: directions 1 (icons + card click), 2 (model is
              home · auto refresh) and 4 (card click only) are off the menu —
              3 (eye icons, the 25 Sep design-review ruling) is the default
              and the only one shown.
                Creation: 'direct' (adds to model directly) is off the menu —
              'promote' (draft in preview) is the default per the same day's
              ruling. See grid-as-workbench.html for the pros/cons of each. */}
          <Menu.Group label="Data preview (Split)">
            <Menu.Item active={previewDirection === 3} onClick={() => applyPreviewDirection(3)}>Select to preview · eye icons</Menu.Item>
          </Menu.Group>
          <Menu.Divider />
          <Menu.Group label="Creation from preview (Split)">
            <Menu.Item active={creationMode === 'promote'} onClick={() => setCreationMode('promote')}>Draft in preview · promote to model</Menu.Item>
          </Menu.Group>
        </Menu>
      </AnchoredMenu>
    </div>
  );

  const settingsDockPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)', padding: 'var(--spacing-4)' }}>

      {/* ── Join rule ─────────────────────────────────────────────── */}
      {settingsSection(
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
            {settingsSectionHeading('Data model join rule')}
            {settingsHelpText('Join rules can be specified in the schema section of this data model')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
            {([
              ['progressive', 'Apply joins progressively', 'Recommended for most cases'],
              ['all', 'Apply all joins', null],
            ] as const).map(([value, text, hint]) => (
              <div key={value} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                <Radio
                  name="dm-join-rule"
                  value={value}
                  checked={joinRule === value}
                  onChange={() => setJoinRule(value)}
                  showLabel={false}
                />
                {/* The recommendation used to ride inline in the label as
                    "(recommended for most cases)", which wrapped onto a line
                    of its own anyway — as a parenthetical in the same colour
                    and size as the choice itself. It is an explanation, so it
                    now reads as one, under the label it explains. */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                  {settingsRowLabel(text, () => setJoinRule(value))}
                  {hint && settingsHelpText(hint)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Join options (moved from the sub-header dropdown) ─────── */}
      {settingsSection(
        <>
          {settingsSectionHeading('Join options')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-2)' }}>
              {settingsRowLabel('Turn off recommendations', () => setTurnOffRecommendations(v => !v))}
              <Toggle checked={turnOffRecommendations} onChange={setTurnOffRecommendations} showLabel={false} />
            </div>
            {/* Radiant Link, not a tertiary Button: these are text actions,
                and Button's own horizontal padding was pushing them out of
                line with every label above them. Sentence case per the
                content guidelines — they were Title Case.
                2026-09-25, Komal: "when the recommendations are turned off,
                no need to show" these — there's nothing to clear or accept
                once recommendations themselves are off. */}
            {!turnOffRecommendations && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                <Link href="#" size="small" onClick={e => e.preventDefault()}>Clear all recommendations</Link>
                <Link href="#" size="small" onClick={e => e.preventDefault()}>Accept all recommendations</Link>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Security ──────────────────────────────────────────────── */}
      {settingsSection(
        <>
          {settingsSectionHeading('Security')}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
            <Checkbox
              checked={disableRowLevelSecurity}
              onChange={setDisableRowLevelSecurity}
              showLabel={false}
            />
            {settingsRowLabel('Disable row level security for data model', () => setDisableRowLevelSecurity(v => !v))}
          </div>
        </>
      )}

      {/* The one rule left in the panel. The three product settings above are
          grouped by spacing alone; this separates them from the prototype's
          own switcher below, which is a different class of thing entirely. */}
      <Divider />

      {/* Last in the panel, with no heading of its own — it isn't a product
          setting, it's the prototype's own switcher, parked out of the way. */}
      {optionsMenu}

    </div>
  );

  // Tables tab's empty canvas. Extracted so Option 3 can render it *inside*
  // .model-canvas — the preview panel is a sibling of the canvas, so keeping
  // the empty state in the old outer branch would take the whole
  // .tables-canvas-wrap (and with it the preview panel) off the page whenever
  // the canvas had no tables.
  const tablesEmptyState = (
    <div className="empty-state" id="tables-empty-state">
      <img src="/spotter-assets/Table=l.svg" width="32" height="32" alt="table icon" />
      <div className="empty-body">
        <div className="empty-title">Start with the right tables</div>
        <div className="empty-desc">Let SpotterModel suggest the best tables and joins for an AI-ready data model</div>
      </div>
      <div className="suggestion-row">
        <a className="suggestion-link" href="#">
          <img src="/spotter-assets/ai icon.svg" width="14" height="14" alt="ai icon" />
          Get table suggestions
        </a>
        <img className="moving-arrow" src="/spotter-assets/Moving arrow.svg" width="14" height="12" alt="arrow" />
      </div>
      <div className="divider-h"></div>
      <span className="drag-hint">Or drag and drop from the left pane</span>
    </div>
  );

  // Options 2 / 2.1 only: the left nav now carries the whole "start here"
  // moment — illustration, copy and the "Add data" button. Two competing
  // calls to action in one screen was one too many, so the canvas first
  // stepped back to a single muted line (2026-09-22) and then, once the left
  // nav's own empty state carried the whole moment on its own, dropped that
  // line entirely too (2026-09-24, Komal: "remove this") — an empty canvas
  // here is now just the dotted-grid background, no text at all. Every other
  // option keeps the original canvas empty state untouched.
  const canvasEmptyState = tablesNavOption === 2 || tablesNavOption === 2.1
    ? null
    : tablesEmptyState;

  return (
    <div className="sm-root">

      {/* APP HEADER — empty for Option 3 (title + tab switcher both moved
          elsewhere), so it's collapsed entirely rather than left as a blank
          bar; the tab-pill bridge to init-dme.js stays in the DOM either way,
          just hidden, so tab switching still works. Removing it hands its
          60px back to body-row (flex:1), which is the height increase. */}
      <div className="app-header" style={isOption3 ? { display: 'none' } : undefined}>
        {!isOption3 && (
          <button
            type="button"
            onClick={() => navigate('/')}
            aria-label="Go to playground"
            className="app-title"
            style={{ background: 'transparent', border: 'none', padding: 0, margin: 0, cursor: 'pointer' }}
          >
            Data model editor
          </button>
        )}
        {!isOption3 && (
          <SegmentedControl options={tabOptions} value={activeTab} onChange={handleTabChange} size="large" />
        )}
        <div className="tab-group" style={{ display: 'none' }}>
          <div className="tab-pill active" data-tab="tables">Tables</div>
          <div className="tab-pill" data-tab="columns">Columns</div>
          <div className="tab-pill" data-tab="formulas">Formulas</div>
          <div className="tab-pill" data-tab="filters">Filters</div>
          <div className="tab-pill" data-tab="parameters">Parameters</div>
          <div className="tab-pill" data-tab="query">Query</div>
          <div className="tab-pill" data-tab="query-asis">Query</div>
          <div className="tab-pill" data-tab="settings">Settings</div>
        </div>
      </div>

      {/* BODY ROW */}
      <div className="body-row">

        <div className="left-and-main">

          {/* SUB-HEADER */}
          <div
            className={tabOption === 3 && option3EmbedMode === 'optimized' ? 'sub-header sub-header-dense' : 'sub-header'}
            style={tabOption === 3 ? { position: 'relative' } : undefined}
          >
            <div
              className="sub-header-info"
              style={tabOption === 3 && option3EmbedMode === 'optimized' ? { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 'var(--spacing-1)' } : undefined}
            >
              {tabOption === 3 && option3EmbedMode === 'optimized' && (
                <button
                  type="button"
                  className="grid-icon-btn"
                  onClick={() => setLeftPaneCollapsed(c => !c)}
                  aria-label={leftPaneCollapsed ? 'Expand tables panel' : 'Collapse tables panel'}
                  title={leftPaneCollapsed ? 'Expand panel' : 'Collapse panel'}
                >
                  {/* Taken from Komal 2026-09-25 (left panel = her direction).
                      Radiant has no panel-toggle glyph, so this inline SVG
                      fills a real registry gap — logged for the DS ask. Her
                      hardcoded #1D232F swapped for currentColor so it themes. */}
                  {/* 2026-09-25, Komal: "use this icon from Query tab, to open
                      and close model inventory instead of [hamburger]" — same
                      two-state bracket/chevron SVG as QueryAsIs.tsx's own
                      "Toggle data panel" button (its `dataPanelVisible`
                      branch), just keyed off leftPaneCollapsed instead. */}
                  {!leftPaneCollapsed ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <g clipPath="url(#sdw-model-inv-close)">
                        <path d="M13.3333 1.14279H2.66663C1.82506 1.14279 1.14282 1.82502 1.14282 2.6666V13.3333C1.14282 14.1748 1.82506 14.8571 2.66663 14.8571H13.3333C14.1749 14.8571 14.8571 14.1748 14.8571 13.3333V2.6666C14.8571 1.82502 14.1749 1.14279 13.3333 1.14279Z" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M5.71436 1.14279V14.8571" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M11.0477 10.2858L8.76196 8.00013L11.0477 5.71442" stroke="currentColor" strokeWidth="1.5"/>
                      </g>
                      <defs><clipPath id="sdw-model-inv-close"><rect width="16" height="16" fill="white"/></clipPath></defs>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <g clipPath="url(#sdw-model-inv-open)">
                        <path d="M13.3333 1.14279H2.66663C1.82506 1.14279 1.14282 1.82502 1.14282 2.6666V13.3333C1.14282 14.1748 1.82506 14.8571 2.66663 14.8571H13.3333C14.1749 14.8571 14.8571 14.1748 14.8571 13.3333V2.6666C14.8571 1.82502 14.1749 1.14279 13.3333 1.14279Z" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M5.71436 1.14279V14.8571" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M8.76189 10.2858L11.0476 8.00013L8.76189 5.71442" stroke="currentColor" strokeWidth="1.5"/>
                      </g>
                      <defs><clipPath id="sdw-model-inv-open"><rect width="16" height="16" fill="white"/></clipPath></defs>
                    </svg>
                  )}
                </button>
              )}
              {editingModelName ? (
                <input
                  autoFocus
                  className="model-name-input"
                  value={modelNameDraft}
                  onChange={e => setModelNameDraft(e.target.value)}
                  onFocus={e => e.currentTarget.select()}
                  onBlur={() => { setModelName(modelNameDraft.trim() || modelName); setEditingModelName(false); }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { e.currentTarget.blur(); }
                    if (e.key === 'Escape') { setModelNameDraft(modelName); setEditingModelName(false); }
                  }}
                />
              ) : (
                <button
                  type="button"
                  className="model-name-placeholder"
                  onClick={() => { setModelNameDraft(modelName); setEditingModelName(true); }}
                >
                  {modelName}
                </button>
              )}
              {tabOption === 3 && option3EmbedMode === 'optimized' && (
                // Popover, not Tooltip (Komal: "open on click, close on clicking
                // outside") — Radiant's Tooltip is hover/focus-only with no
                // click or click-outside support. Popover already defaults to
                // trigger="click" and closeOnClickOutside=true, so no extra
                // props are needed for the interaction itself. Its default
                // chrome is a plain white bordered card, though, so
                // .model-info-popover (dme.css) restyles it back to the same
                // dark bubble the Tooltip used — same tokens, nothing invented.
                <Popover
                  placement="bottom"
                  className="model-info-popover"
                  content={
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
                        <img src="/spotter-assets/Snowflake.svg" width="14" height="14" alt="" />
                        <span>Global sales connection</span>
                      </div>
                      <span>{modelDesc}</span>
                    </div>
                  }
                >
                  <span style={{ display: 'flex', cursor: 'pointer' }}>
                    <Icon name="info-circle" size="xs" color="var(--rd-sys-color-content-secondary)" />
                  </span>
                </Popover>
              )}
              {!(tabOption === 3 && option3EmbedMode === 'optimized') && (
                <span className="model-desc-placeholder">{modelDesc}</span>
              )}
            </div>
            {tabOption === 3 && (
              tabOption === 3 && option3EmbedMode === 'optimized' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                  <SegmentedControl
                    options={dataModelLayout === 'split' ? TAB_OPTIONS_SPLIT : TAB_OPTIONS_OPTION3_OPTIMIZED}
                    value={activeTab}
                    onChange={handleTabChange}
                    size="default"
                  />
                </div>
              ) : (
                <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                  <SegmentedControl
                    options={tabOptions}
                    value={activeTab}
                    onChange={handleTabChange}
                    size="large"
                  />
                </div>
              )
            )}
            {tabOption === 3 && option3EmbedMode === 'optimized' ? (
              /* Mirrors sub-header-info's flex:1 so the tab switch above lands
                 at the true center of the header, regardless of the name's or
                 actions' own width. */
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--spacing-2)' }}>
                <div className="sub-header-actions" id="actions-tables"></div>
                {/* Rendered outside #actions-tables, which the legacy tab-switch
                    script hides on every tab but "tables" — this stays visible
                    across Tables and Columns. */}
                {spotterModelEnabled && agentPanelCollapsed && activeTab !== 'query' && activeTab !== 'query-asis' && (
                  <button
                    type="button"
                    className="agent-panel-collapsed-toggle"
                    onClick={() => setAgentPanelCollapsed(false)}
                    aria-label="Open SpotterModel panel"
                    title="SpotterModel"
                  >
                    <img src="/spotter-assets/SpotterModel avatar.svg" width="28" height="28" alt="" />
                  </button>
                )}
                {/* Save on the left, Exit last, with a rule between them
                    (2026-09-22, Komal: "move exit to the right and save
                    changes to the left. Between both, add a separator") — the
                    divider marks Exit as leaving the editor rather than
                    another step in the same sequence. */}
                <Button variant="primary" onClick={openSaveReview}>Save model</Button>
                {/* Explicit 24px: Divider's vertical rule is height:100%, and
                    in this centre-aligned row the span collapsed to the
                    component's own 16px min-height, which read as a speck
                    rather than a separator. */}
                <span style={{ display: 'flex', alignItems: 'center', height: 24, marginInline: 'var(--spacing-1)' }}><Divider vertical /></span>
                <Button variant="secondary">Exit</Button>
              </div>
            ) : (
              <>
                <div className="sub-header-actions" id="actions-tables">
                  <Button variant="secondary">Find</Button>
                  <div style={{ display: 'contents' }} onClickCapture={e => { e.preventDefault(); e.stopPropagation(); }}>
                    <Select placeholder="Join options" options={JOIN_OPTIONS} className="sub-header-select" />
                  </div>
                  <div style={{ display: 'contents' }} onClickCapture={e => { e.preventDefault(); e.stopPropagation(); }}>
                    <Select placeholder="100%" options={ZOOM_OPTIONS} className="sub-header-select" />
                  </div>
                </div>
                {spotterModelEnabled && agentPanelCollapsed && activeTab !== 'query' && activeTab !== 'query-asis' && (
                  <button
                    type="button"
                    className="agent-panel-collapsed-toggle"
                    onClick={() => setAgentPanelCollapsed(false)}
                    aria-label="Open SpotterModel panel"
                    title="SpotterModel"
                  >
                    <img src="/spotter-assets/SpotterModel avatar.svg" width="28" height="28" alt="" />
                  </button>
                )}
              </>
            )}
            <div className="sub-header-actions" id="actions-default" style={{ display: 'none' }}></div>
          </div>

          {/* Content row */}
          <div className="content-row">
            <OverlayLoading variant="dots" isVisible={modelLoading.visible} label={modelLoading.label} />

            {/* LEFT PANE — Optimized only: collapsible + resizable in width.
                Collapses to a slim icon rail (sibling, below) instead of
                unmounting, so #pane-tables-section stays in the DOM for
                init-dme.js's legacy tab-switch script. There is no longer a
                second #pane-columns-section: Builder and Semantics share this
                one pane. */}
            <div
              className="left-pane"
              id="left-pane"
              style={tabOption === 3 && option3EmbedMode === 'optimized' ? {
                width: leftPaneCollapsed ? 0 : leftPaneWidth,
                minWidth: leftPaneCollapsed ? 0 : leftPaneWidth,
                borderRightWidth: leftPaneCollapsed ? 0 : undefined,
                position: 'relative',
                transition: leftPaneResizing ? 'none' : undefined,
              } : undefined}
            >
              {tabOption === 3 && option3EmbedMode === 'optimized' && !leftPaneCollapsed && (
                <div
                  className="left-pane-resize-handle"
                  onPointerDown={e => {
                    e.preventDefault();
                    setLeftPaneResizing(true);
                    const startX = e.clientX;
                    const startW = leftPaneWidth;
                    const onMove = (ev: PointerEvent) => setLeftPaneWidth(Math.max(LEFT_PANE_MIN_WIDTH, Math.min(LEFT_PANE_MAX_WIDTH, startW + (ev.clientX - startX))));
                    const onUp = () => {
                      setLeftPaneResizing(false);
                      window.removeEventListener('pointermove', onMove);
                      window.removeEventListener('pointerup', onUp);
                    };
                    window.addEventListener('pointermove', onMove);
                    window.addEventListener('pointerup', onUp);
                  }}
                />
              )}

              {/* 2026-09-25, Komal: "add a model inventory title" — optimized
                  layout only: this is the case with no left-pane-header of its
                  own (Tables is just another docked section, see comment
                  below), so the pane otherwise opened with no title at all. */}
              {tabOption === 3 && option3EmbedMode === 'optimized' && (
                <div className="left-pane-inventory-title">Model inventory</div>
              )}

              <div id="pane-tables-section" className={`pane-section${tabOption === 3 && option3EmbedMode === 'optimized' ? ' pane-section-docked' : ''}`}>
                {/* Optimized: the pane has no header of its own — label, count
                    and search all sit inside the Tables card below, so Tables is
                    a section like Formula/Filters/Parameters rather than the
                    pane's title with a list under it. */}
                {!(tabOption === 3 && option3EmbedMode === 'optimized') && (
                  <div className="left-pane-header">
                    <div className="connection-row">
                      <img src="/spotter-assets/Snowflake.svg" width="14" height="14" alt="connection" />
                      <span className="connection-name">Global sales connection</span>
                    </div>
                    <div className="pane-title-row">
                      <span style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0 }}>
                        <Typography variant="content-label" as="span" noMargin>Tables</Typography>
                        <Typography variant="footnote" as="span" color="gray-light" noMargin>{addedTableNames.size}</Typography>
                      </span>
                      <div className="grid-icon-btn">
                        <img src="/spotter-assets/Knowledge card button.svg" width="24" height="24" alt="layout" />
                      </div>
                    </div>
                    {isOption3 ? (
                      <div className="pane-search-input" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <SearchInput placeholder="Search tables" />
                        </div>
                        <Button variant="secondary" icon="filter" iconOnly aria-label="Filter tables">Filter tables</Button>
                        <Button variant="secondary" icon="sort" iconOnly aria-label="Sort tables">Sort tables</Button>
                      </div>
                    ) : (
                      <>
                        <SearchInput placeholder="Search tables" className="pane-search-input" />
                        <div className="filter-row">
                          <Button variant="secondary">Add filters</Button>
                          <div style={{ display: 'contents' }} onClickCapture={e => { e.preventDefault(); e.stopPropagation(); }}>
                            <Select placeholder="Sort by name" options={SORT_OPTIONS} className="sort-select" />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
                {tabOption === 3 && option3EmbedMode === 'optimized' && dataSourceSelectorOption === 2 && (tablesNavOption === 2 || tablesNavOption === 2.1) ? (
                  // Tables-section Option 2 (2026-09-21, Komal) — starts empty;
                  // "+" and the empty state's own button both open the same
                  // table browser. Option 2.1 (2026-09-22) is identical in
                  // every way except which component renders that browser —
                  // TableBrowserModal (pop-up) for Option 2, TableColumnSidePanel
                  // (inline, no leaving context) for Option 2.1 — see the
                  // render site further down. Option 1 above is untouched.
                  <div className={`dock-${paneBalance} dock-tables`} data-open={browserDockOpen === 'tables'}>
                    <DockRow
                      balance={paneBalance}
                      fill
                      open={browserDockOpen === 'tables'}
                      onToggle={() => toggleDock('tables')}
                      icon={<span style={{ display: 'flex' }}><Icon name="table" size="s" color="var(--rd-sys-color-content-primary)" /></span>}
                      label="Tables"
                      count={addedTableNames.size}
                      // Always shown now (2026-09-24, Komal: "add the plus
                      // icon on the tables panel header") — previously hidden
                      // at 0 tables since the empty state's own big "Add
                      // tables" button covered that case; both open the same
                      // browser via openOption2Modal either way.
                      onAdd={openOption2Modal}
                      addLabel="Add tables"
                    >
                      {addedTableNames.size === 0 ? (
                        // A dedicated, richer empty state for this one spot
                        // (2026-09-22, Komal: "make this empty state
                        // significantly more delightful... without
                        // onboarding, it tells users... they need to start
                        // by adding tables") — Formulas/Filters/Parameters
                        // later got the same PanelEmptyState treatment
                        // (2026-09-24), each with their own bespoke
                        // illustration too, but this one's is traced from
                        // her own mock rather than an original scene. Copy is
                        // unchanged from what she already approved. The
                        // illustration took several
                        // rounds of me guessing before she sent her own mock
                        // to build from; see the
                        // SVG below. Primary — not secondary — button, so the
                        // single next action is unmistakable at a glance,
                        // with the AI route offered under it as the "or".
                        // flex:1 + centred both ways — DockRow's `fill` body is
                        // a column flex container, so the whole state sits in
                        // the middle of the Tables section rather than pinned
                        // to its top under a tall stretch of white (2026-09-22,
                        // Komal: "place the whole empty state in the centre of
                        // the section").
                        // Rhythm set per gap rather than one uniform 12px
                        // (2026-09-22, Komal: "make the illustration slightly
                        // smaller and balance the illustration + text + CTA +
                        // link visually"): 20px under the illustration, 4px
                        // between title and description, 20px above the
                        // button, 12px down to the "or" and its link. The two
                        // 20px gaps sit either side of the copy so it reads as
                        // the middle of three even bands, and the "or" stays
                        // tucked under the button it qualifies.
                        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0, padding: 'var(--spacing-6)', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: 'var(--spacing-5)' }}>
                            {/* 2026-09-25, Komal: "use this illustration for
                                the empty state of tables" — Radiant 3.0's own
                                "Muted alert illustration" (figma.com/design/
                                1QlRveXx4wppvDXyPVWUTK, node 25122:178959),
                                traced 1:1 from its exported vectors. Frame +
                                centerpiece now live in MutedAlertIllustration
                                / DATA_CENTERPIECE above, shared with Formula/
                                Filters/Parameters' own illustrations.

                                "Add motion to bring attention" — the disc
                                stack gets a slow breathing bob and the two
                                corner accents twinkle out of phase with it,
                                so the eye keeps finding the icon without
                                anything reading as busy. Stops for good the
                                first time "Add data" opens the picker
                                (.empty-state-illo-paused, driven by
                                option2IlloPaused) and honours
                                prefers-reduced-motion. */}
                            <MutedAlertIllustration clipId="illo-data-clip" centerpiece={DATA_CENTERPIECE} paused={option2IlloPaused} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
                            <Typography variant="content-label" as="div" noMargin>Start with your data</Typography>
                            <Typography variant="footnote" as="div" color="gray-light" noMargin style={{ maxWidth: 230 }}>
                              Browse tables and pick the columns you need.
                            </Typography>
                          </div>
                          <Button variant="secondary" icon="plus" onClick={openOption2Modal} style={{ marginTop: 'var(--spacing-5)' }}>Add data</Button>
                        </div>
                      ) : (
                        <>
                          <div className="dock-search-row">
                            <div style={{ flex: 1, minWidth: 0 }}>
                              {/* 2026-09-25, Komal: "the placeholder text
                                  should not overflow the search bar" — this
                                  row's own width (search input squeezed
                                  between the panel edge and the Filter/Sort
                                  buttons) only fits ~145px of text; "Search
                                  tables and columns" measured ~174px and
                                  clipped. Dropping the redundant "Search"
                                  (the icon already says that) keeps the
                                  meaning intact at ~128px. */}
                              <SearchInput placeholder="Tables and columns" value={tableQuery} onChange={e => setTableQuery(e.target.value)} />
                            </div>
                            <Button variant="secondary" icon="filter" iconOnly aria-label="Filter tables">Filter tables</Button>
                            <Button
                              ref={tableSortBtnRef}
                              variant="secondary"
                              icon="sort"
                              iconOnly
                              aria-label="Sort tables"
                              onClick={() => setTableSortMenuOpen(o => !o)}
                            >
                              Sort tables
                            </Button>
                            <AnchoredMenu
                              open={tableSortMenuOpen}
                              anchorRef={tableSortBtnRef}
                              onClose={() => setTableSortMenuOpen(false)}
                              placement="bottom-end"
                            >
                              <Menu onClose={() => setTableSortMenuOpen(false)}>
                                <Menu.Item active={tableSort === 'name'} onClick={() => { setTableSort('name'); setTableSortMenuOpen(false); }}>Sort by name</Menu.Item>
                                <Menu.Item active={tableSort === 'modified'} onClick={() => { setTableSort('modified'); setTableSortMenuOpen(false); }}>Sort by modified</Menu.Item>
                              </Menu>
                            </AnchoredMenu>
                          </div>
                          <div className={tablePickerStyles.list}>
                            {visibleCanvasTables.map(t => {
                              const added = columnTreeData.modelColumns.find(g => g.table === t.name)?.columns ?? [];
                              return (
                                <AddedTableRow
                                  key={t.name}
                                  name={t.name}
                                  addedColumns={added}
                                  isOpen={option2OpenTable === t.name}
                                  onToggleOpen={() => setOption2OpenTable(o => o === t.name ? null : t.name)}
                                  onEdit={() => openOption2ModalFor(t.name)}
                                />
                              );
                            })}
                            {/* A live search needs somewhere to land when it
                                matches nothing, or it reads as broken. Same
                                wording TableColumnBrowserBody's own search
                                already uses. */}
                            {visibleCanvasTables.length === 0 && (
                              <div className={tablePickerStyles.empty}>No tables match "{tableQuery}"</div>
                            )}
                          </div>
                        </>
                      )}
                    </DockRow>
                  </div>
                ) : tabOption === 3 && option3EmbedMode === 'optimized' && dataSourceSelectorOption === 2 && tablesNavOption === 3 ? (
                  // Tables-section Option 3 (2026-09-22, Komal) — "Available" /
                  // "In this model" tabs; lands on Available by default. Reuses
                  // Option 1's TablePickerV2 completely unmodified (its own
                  // "+" adds the table and moves it to "In this model";
                  // columns are added/removed there, in place), so Options 1
                  // and 2 above are untouched by this branch.
                  <div className={`dock-${paneBalance} dock-tables`} data-open={browserDockOpen === 'tables'}>
                    <DockRow
                      balance={paneBalance}
                      fill
                      open={browserDockOpen === 'tables'}
                      onToggle={() => toggleDock('tables')}
                      icon={<span style={{ display: 'flex' }}><Icon name="table" size="s" color="var(--rd-sys-color-content-primary)" /></span>}
                      label="Tables"
                      count={addedTableNames.size}
                    >
                      <div style={{ padding: '0 var(--spacing-4)', flexShrink: 0 }}>
                        <Tabs
                          tabs={[{ id: 'inModel', label: 'In this model' }, { id: 'available', label: 'Available' }]}
                          activeTab={option3Tab}
                          onTabChange={id => setOption3Tab(id as 'available' | 'inModel')}
                        />
                      </div>
                      <div className="dock-search-row">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <SearchInput placeholder="Search tables" />
                        </div>
                        <Button variant="secondary" icon="filter" iconOnly aria-label="Filter tables">Filter tables</Button>
                        <Button variant="secondary" icon="sort" iconOnly aria-label="Sort tables">Sort tables</Button>
                      </div>
                      <TablePickerV2
                        data={{
                          tables: unifiedTreeData.tables.filter(t => option3Tab === 'inModel' ? addedTableNames.has(t.name) : !addedTableNames.has(t.name)),
                          dataSourceTables: unifiedTreeData.dataSourceTables,
                          modelColumns: unifiedTreeData.modelColumns,
                        }}
                        addedTableNames={addedTableNames}
                        onToggleColumn={handleToggleColumn}
                        onAddTable={handleAddTable}
                        openTable={option3OpenTable}
                        onOpenTableChange={setOption3OpenTable}
                        readOnlyColumns={option3Tab === 'available'}
                      />
                    </DockRow>
                  </div>
                ) : tabOption === 3 && option3EmbedMode === 'optimized' && dataSourceSelectorOption === 2 && tablesNavOption === 4 ? (
                  // Tables-section Option 4 (2026-09-22, Komal) — flat list,
                  // no expand/collapse. Each row is just a name and a "+";
                  // the "+" opens the side panel (rendered as a sibling of
                  // #left-pane below, next to .main-content) rather than
                  // expanding anything inline. Options 1-3 above untouched.
                  <div className={`dock-${paneBalance} dock-tables`} data-open={browserDockOpen === 'tables'}>
                    <DockRow
                      balance={paneBalance}
                      fill
                      open={browserDockOpen === 'tables'}
                      onToggle={() => toggleDock('tables')}
                      icon={<span style={{ display: 'flex' }}><Icon name="table" size="s" color="var(--rd-sys-color-content-primary)" /></span>}
                      label="Tables"
                      count={addedTableNames.size}
                    >
                      <div className="dock-search-row">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <SearchInput placeholder="Search tables" />
                        </div>
                        <Button variant="secondary" icon="filter" iconOnly aria-label="Filter tables">Filter tables</Button>
                        <Button variant="secondary" icon="sort" iconOnly aria-label="Sort tables">Sort tables</Button>
                      </div>
                      <div className={tablePickerStyles.list}>
                        {unifiedTreeData.tables.map(t => {
                          const onCanvas = addedTableNames.has(t.name);
                          return (
                            <div key={t.name} className={`${tablePickerStyles.tableRow} option4-table-row`} style={{ cursor: 'default' }}>
                              <button
                                type="button"
                                onClick={() => openOption4Panel(t.name)}
                                className={tablePickerStyles.tableName}
                                style={{ paddingLeft: 'var(--spacing-1)', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                              >
                                {t.name}
                              </button>
                              {!onCanvas && (
                                <button
                                  type="button"
                                  className={`${tablePickerStyles.add} option4-add-btn`}
                                  onClick={() => openOption4Panel(t.name)}
                                  aria-label={`Add ${t.name} to the model`}
                                >
                                  <Icon name="plus" size="xs" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </DockRow>
                  </div>
                ) : tabOption === 3 && option3EmbedMode === 'optimized' && dataSourceSelectorOption === 2 ? (
                  <div className={`dock-${paneBalance} dock-tables`} data-open={browserDockOpen === 'tables'}>
                    {/* The count is tables in the model, matching what the
                        section counts below mean — not the 12 source tables the
                        list shows. */}
                    <DockRow
                      balance={paneBalance}
                      fill
                      open={browserDockOpen === 'tables'}
                      onToggle={() => toggleDock('tables')}
                      icon={<span style={{ display: 'flex' }}><Icon name="table" size="s" color="var(--rd-sys-color-content-primary)" /></span>}
                      label="Tables"
                      count={addedTableNames.size}
                    >
                      <div className="dock-search-row">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <SearchInput placeholder="Search tables" value={tableQuery} onChange={e => setTableQuery(e.target.value)} />
                        </div>
                        <Button variant="secondary" icon="filter" iconOnly aria-label="Filter tables">Filter tables</Button>
                        <Button
                          ref={tableSortBtnRef}
                          variant="secondary"
                          icon="sort"
                          iconOnly
                          aria-label="Sort tables"
                          onClick={() => setTableSortMenuOpen(o => !o)}
                        >
                          Sort tables
                        </Button>
                        <AnchoredMenu
                          open={tableSortMenuOpen}
                          anchorRef={tableSortBtnRef}
                          onClose={() => setTableSortMenuOpen(false)}
                          placement="bottom-end"
                        >
                          <Menu onClose={() => setTableSortMenuOpen(false)}>
                            <Menu.Item active={tableSort === 'name'} onClick={() => { setTableSort('name'); setTableSortMenuOpen(false); }}>Sort by name</Menu.Item>
                            <Menu.Item active={tableSort === 'modified'} onClick={() => { setTableSort('modified'); setTableSortMenuOpen(false); }}>Sort by modified</Menu.Item>
                          </Menu>
                        </AnchoredMenu>
                      </div>
                      {tableSelectorOption === 2 ? (
                        <TablePickerV2
                          data={visibleTreeData}
                          addedTableNames={addedTableNames}
                          onToggleColumn={handleToggleColumn}
                          onAddTable={handleAddTable}
                          openTable={openTableV2}
                          onOpenTableChange={setOpenTableV2}
                        />
                      ) : (
                        <ColumnTree data={visibleTreeData} addedTableNames={addedTableNames} draggableTables checkboxColumns onToggleColumn={handleToggleColumn} />
                      )}
                    </DockRow>
                  </div>
                ) : (
                  <div className="table-list">
                    {['fact_customer','fact_new_retail_sales','fact_sales','dim_store','dim_product','fact_region','fact_inventory','dim_shipping_method','dim_feedback','dim_date','fact_sales_pipeline','fact_customer_satisfaction'].map(t => (
                      <div key={t} className="table-item">
                        <div className="table-chip">
                          <div className="drag-handle"><img src="/spotter-assets/3 dot vertical.svg" alt="" /></div>
                          {t}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {isOption3 ? (
                  // Whichever section is open owns the pane's leftover height,
                  // so the collapsed ones above it stay at the top and the
                  // ones below it pin to the bottom (2026-09-22, Komal: "when
                  // tables are expanded, the section should take full height
                  // that's remaining after pinning the filters, parameters and
                  // settings at the bottom. Similarly for filters and
                  // parameters"). Tables' own wrapper already grows on its
                  // own; this one grows whenever the open section is one of
                  // the four it holds, and stays shrink-to-fit otherwise.
                  <div
                    className={`dock-${paneBalance}`}
                    style={browserDockOpen && browserDockOpen !== 'tables'
                      ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }
                      : { flexShrink: 0 }}
                  >
                    <DockRow fill balance={paneBalance} icon={<span style={{ display: 'flex' }}><Icon name="formula" size="s" color="var(--rd-sys-color-content-primary)" /></span>} label="Formula" count={modelFormulas.length} open={browserDockOpen === 'formula'} onToggle={() => toggleDock('formula')} onAdd={() => { setEditingFormula(null); setFormulaEditorOpen(true); }} addLabel="Add formula">
                      {modelFormulas.length === 0 ? (
                        <PanelEmptyState
                          illustration={FORMULA_ILLUSTRATION}
                          title="Add a formula"
                          description="A calculated field built from columns and functions that behaves just like any other column once added."
                          buttonLabel="Add formula"
                          onAdd={() => { setEditingFormula(null); setFormulaEditorOpen(true); }}
                        />
                      ) : (
                        <>
                        <DockSearch placeholder="Search formulas" value={formulaQuery} onChange={setFormulaQuery} />
                        <List
                          className="dock-list"
                          items={visibleFormulas.map(f => ({ id: f.name, formula: f }))}
                          renderItem={item => {
                            const f = item.formula as FormulaDraft;
                            return (
                              <DockListRow
                                name={f.name}
                                detail={f.expression}
                                onEdit={() => openFormulaEditor(f)}
                                onCopy={() => copyFormula(f)}
                                onDelete={() => deleteFormula(f.name)}
                              />
                            );
                          }}
                        />
                        </>
                      )}

                    </DockRow>
                    {/* 2026-09-25, Komal: "update the filter icon in the left
                        panel filter header to this" — figma.com/design/
                        1QlRveXx4wppvDXyPVWUTK, node 25084:36683 "funnel
                        solid". Radiant's registry already ships exactly that
                        vector as 'funnel' (its own path is the node's export
                        placed at 1/2.5 inside an 18x18 box — identical
                        geometry), so this is the registry icon rather than
                        another local copy. It also settles the mismatch this
                        section had: its empty-state illustration was already
                        wearing 'funnel' while the header wore the sliders
                        glyph. */}
                    <DockRow fill balance={paneBalance} icon={<span style={{ display: 'flex' }}><Icon name="funnel" size="s" color="var(--rd-sys-color-content-primary)" /></span>} label="Filters" count={modelFilters.length} open={browserDockOpen === 'filters'} onToggle={() => toggleDock('filters')} onAdd={() => {}} addLabel="Add filter">
                      {modelFilters.length === 0 ? (
                        <PanelEmptyState
                          illustration={FILTER_ILLUSTRATION}
                          title="Add a filter"
                          description="A rule that scopes this model to only the rows that matter, so every search and Liveboard built on it inherits the same limits automatically."
                          buttonLabel="Add filter"
                          onAdd={() => {}}
                        />
                      ) : (
                        <>
                        <DockSearch placeholder="Search filters" value={filterQuery} onChange={setFilterQuery} />
                        <List
                          className="dock-list"
                          items={visibleFilters.map(f => ({ id: f.col, filter: f }))}
                          renderItem={item => {
                            const f = item.filter as { col: string; val: string };
                            return (
                              <DockListRow
                                name={f.col}
                                detail={`${f.col} = ${f.val}`}
                                // Same UX as the grid: the preview's Add-filter
                                // modal, seeded (2026-09-24, Vivek).
                                onEdit={() => requestFilterEdit(f.col)}
                                // A filter is identified by its column, so a
                                // duplicate would collide with the row it came
                                // from — no-op until filters carry their own id.
                                onCopy={() => {}}
                                onDelete={() => setModelFilters(prev => prev.filter(x => x.col !== f.col))}
                              />
                            );
                          }}
                        />
                        </>
                      )}

                    </DockRow>
                    <DockRow fill balance={paneBalance} icon={<span style={{ display: 'flex' }}><Icon name="tag" size="s" color="var(--rd-sys-color-content-primary)" /></span>} label="Parameters" count={modelParameters.length} open={browserDockOpen === 'parameters'} onToggle={() => toggleDock('parameters')} onAdd={() => setParameterEditorOpen(true)} addLabel="Add parameter">
                      {modelParameters.length === 0 ? (
                        <PanelEmptyState
                          illustration={PARAMETER_ILLUSTRATION}
                          title="Add a parameter"
                          description="A reusable value, like a growth rate or threshold, that formulas and filters can reference, so you can test different scenarios without rewriting them."
                          buttonLabel="Add parameter"
                          onAdd={() => setParameterEditorOpen(true)}
                        />
                      ) : (
                        <>
                        <DockSearch placeholder="Search parameters" value={parameterQuery} onChange={setParameterQuery} />
                        <List
                          className="dock-list"
                          items={visibleParameters.map(p => ({ id: p.name, parameter: p }))}
                          renderItem={item => {
                            const p = item.parameter as ModelParameter;
                            return (
                              <DockListRow
                                name={p.name}
                                detail={`${p.name} = ${p.value}`}
                                onEdit={() => {}}
                                onCopy={() => copyParameter(p)}
                                onDelete={() => deleteParameter(p.name)}
                              />
                            );
                          }}
                        />
                        </>
                      )}

                    </DockRow>
                    {tabOption === 3 && option3EmbedMode === 'optimized' && (
                      <DockRow
                        fill
                        balance={paneBalance}
                        icon={<span style={{ display: 'flex' }}><Icon name="settings" size="s" color="var(--rd-sys-color-content-primary)" /></span>}
                        label="Settings"
                        open={browserDockOpen === 'settings'}
                        onToggle={() => toggleDock('settings')}
                      >
                        {settingsDockPanel}
                      </DockRow>
                    )}
                  </div>
                ) : (
                  <div className="left-pane-footer">
                    <Toggle checked={tablesUnselected} onChange={setTablesUnselected} label="Show unselected" labelPosition="right" />
                  </div>
                )}
              </div>

            </div>{/* /left-pane */}

            {/* OPTION 2.1 SIDE PANEL — same picker as Option 2's pop-up
                (identical state/handlers), just an inline overlay here
                instead of a Modal, so browsing tables/columns never covers
                the left nav (2026-09-22, Komal: "prevent the user from
                leaving context"). It overlays the canvas/preview panel
                rather than shrinking them ("should be an overlay... instead
                of shrinking these") — leftOffset positions it right where
                #left-pane ends. */}
            {tablesNavOption === 2.1 && (
              <TableColumnSidePanel
                open={option2ModalOpen}
                onClose={tableInfoMode === 'footer' ? () => setOption2ModalOpen(false) : closeOption2Panel}
                catalog={unifiedTreeData}
                draft={tableInfoMode === 'footer' ? option2Draft : columnTreeData.modelColumns}
                onToggleColumn={tableInfoMode === 'footer' ? handleOption2DraftToggle : handleOption2LiveToggle}
                initialFocusTable={option2FocusTable}
                leftOffset={leftPaneCollapsed ? 0 : leftPaneWidth}
                tableInfoMode={tableInfoMode === 'footer' ? 'icon' : tableInfoMode}
                // CTAs moved from a footer row to the header's top right
                // (2026-09-28, Komal: "Add to model and separator and close.
                // Something like this" — pointing at the top bar's Save model
                // | divider | Exit). Same recipe as that pair: primary first,
                // a 24px vertical Divider, the dismiss last.
                headerActions={tableInfoMode === 'footer' ? (
                  <>
                    <Button variant="primary" onClick={handleOption2Confirm} disabled={!option2HasChanges}>
                      {addedTableNames.size > 0 ? 'Update' : 'Add to model'}
                    </Button>
                    <span style={{ display: 'flex', alignItems: 'center', height: 24, marginInline: 'var(--spacing-1)' }}><Divider vertical /></span>
                    {/* Cancel is a secondary link, not a button (2026-09-28,
                        Komal: "make close a secondary link instead of button.
                        Follow Radiant strictly") — Radiant Link's own `gray`
                        colour, which the component documents as its
                        subtle/secondary link (content-secondary), default
                        14px size, no overrides. Labelled "Cancel" (Komal, same
                        day: "say cancel instead of close"). */}
                    <Link href="#" color="gray" onClick={e => { e.preventDefault(); setOption2ModalOpen(false); }}>Cancel</Link>
                  </>
                ) : undefined}
              />
            )}

            {/* OPTION 4 COLUMN PANEL — opens to the right of the left pane
                (a flex sibling in .content-row, so it pushes .main-content
                over rather than covering it) when a table's "+" is clicked.
                Draft-only: nothing reaches the canvas until "Add to model". */}
            {tablesNavOption === 4 && option4PanelTable && (
              <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'var(--rd-sys-color-background-base)', borderRight: '1px solid var(--rd-sys-color-border-divider)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--spacing-3) var(--spacing-4)', borderBottom: '1px solid var(--rd-sys-color-border-divider)', flexShrink: 0 }}>
                  <Typography variant="content-label" as="span" noMargin>{option4PanelTable}</Typography>
                  <button
                    type="button"
                    onClick={closeOption4Panel}
                    aria-label="Close"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, border: 'none', background: 'transparent', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--rd-sys-color-content-secondary)' }}
                  >
                    <Icon name="cross" size="xs" />
                  </button>
                </div>
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 'var(--spacing-2) var(--spacing-4)' }}>
                  {(columnTreeData.dataSourceTables.find(d => d.name === option4PanelTable)?.columns ?? []).map(c => (
                    <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', padding: '6px 0', cursor: 'pointer' }}>
                      <Checkbox
                        checked={option4Draft.includes(c)}
                        onChange={checked => setOption4Draft(prev => checked ? [...prev, c] : prev.filter(x => x !== c))}
                        showLabel={false}
                      />
                      <ColumnChip label={c} />
                    </label>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)', padding: 'var(--spacing-3) var(--spacing-4)', borderTop: '1px solid var(--rd-sys-color-border-divider)', flexShrink: 0 }}>
                  <Button variant="secondary" onClick={closeOption4Panel}>Cancel</Button>
                  <Button variant="primary" onClick={confirmOption4} disabled={option4Draft.length === 0}>Add to model</Button>
                </div>
              </div>
            )}

            {/* MAIN CONTENT */}
            <div className="main-content">

              {/* Tables tab */}
              <div className="tab-content" id="content-tables">
                {/* Option 3 skips this branch even with an empty canvas — its
                    empty state renders inside .model-canvas instead, so the
                    preview panel stays docked at the bottom either way. */}
                {tableCanvasData.tables.length === 0 && !isOption3 ? (
                  canvasEmptyState
                ) : tabOption === 2 || isOption3 ? (
                  <div className="tables-canvas-wrap">
                    {/* Option 3 only (both "as is" and "optimized"): dotted-grid
                        canvas background. Cards/joins themselves are unchanged. */}
                    <div className="model-canvas" id="tables-canvas" style={{
                      position: 'relative',
                      flex: 1,
                      ...(tabOption === 3 ? {
                        backgroundColor: 'var(--rd-sys-color-background-sunken, #F6F8FA)',
                        backgroundImage: 'radial-gradient(circle, var(--rd-sys-color-background-inset, #C0C6CF) 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                      } : {}),
                    }}
                    onClick={tabOption === 3 && option3EmbedMode === 'optimized' && canvasPreviewOption === 1 ? e => {
                      // Only the canvas background itself, not a bubbled click
                      // from a table card or join line/badge. Option 2 (2026-
                      // 09-23, Komal: "make preview very explicit... not by
                      // clicking outside") drops this handler entirely — the
                      // last explicit pick just persists.
                      if (e.target !== e.currentTarget) return;
                      if (dataModelLayout === 'split') {
                        // Background clicks never touch the data preview
                        // (Vivek, 2026-09-23: "it is breaking the flow") —
                        // selection and scope both hold; the panel moves only
                        // when the user clicks an object, the dropdown, or a
                        // preview control. Direction 3 (hidden) still clears
                        // its decoupled highlight.
                        if (previewDirection === 3) { setSelTable(''); setSelJoin(null); }
                        return;
                      }
                      setPreviewTable('');
                      setPreviewJoin(null);
                      setPreviewScope('none');
                    } : undefined}
                    >
                      {/* Empty canvas: just the dotted-grid background — no
                          text or icon (2026-09-25, Vivek: "we only need
                          background and grid"). */}
                      {tableCanvasData.tables.length === 0 ? null : (
                      <TableCanvas
                        tables={tableCanvasData.tables}
                        joins={tableCanvasData.joins}
                        // Cards and joins wear the product-reference look
                        // (2026-09-25, Vivek's screenshot); only the dotted
                        // grey canvas background differs from the product.
                        skin="product"
                        onTableDragEnd={(name, x, y) => (window as any)._handleTableDrag?.(name, x, y)}
                        selectedTable={dataModelLayout === 'split' && previewDirection === 3 ? selTable : tabOption === 3 && previewScope !== 'table' ? '' : previewTable}
                        onSelectTable={dataModelLayout === 'split' && previewDirection === 3
                          // Direction 3 (2026-09-25, Vivek): a card click does
                          // NOTHING — only the eye and ••• act; hover keeps
                          // the border highlight. No click state at all.
                          ? undefined
                          : name => {
                              setPreviewTable(name); setPreviewJoin(null); setPreviewScope('table');
                              // Direction 4 only: the card click IS the explicit
                              // preview ask (it replaced the eye icon), so like
                              // the eye/CTA it also opens a closed panel
                              // (2026-09-24, Vivek). Directions 1/2 unchanged —
                              // 1 keeps the eye as the opener.
                              if (dataModelLayout === 'split' && previewDirection === 4) setPreviewOpen(true);
                            }}
                        {...(tabOption === 3 ? {
                          selectedJoinKey: dataModelLayout === 'split' && previewDirection === 3
                            ? (selJoin ? joinKey(selJoin) : undefined)
                            : (previewScope === 'join' && previewJoin ? joinKey(previewJoin) : undefined),
                          // Eye-icon direction (3): a badge click opens the
                          // Preview/Edit/Delete menu, and also selects the
                          // join so its line and both joined cards highlight
                          // while the menu is up (2026-09-25, Vivek — the
                          // product highlights the line on join click).
                          ...(dataModelLayout === 'split' && previewDirection === 3 ? {
                            onJoinMenu: (j: JoinInfo, e: React.MouseEvent) => {
                              setSelJoin(j); setSelTable('');
                              setJoinMenu({ j, x: e.clientX, y: e.clientY });
                            },
                          } : {}),
                          onSelectJoin: dataModelLayout === 'split' && previewDirection === 3
                            ? (j: JoinInfo) => { setSelJoin(j); setSelTable(''); }
                            : (j: JoinInfo) => {
                                setPreviewJoin(j); setPreviewScope('join');
                                // Same rule as the card click above: direction 4's
                                // join click is the explicit ask — open a closed panel.
                                if (dataModelLayout === 'split' && previewDirection === 4) setPreviewOpen(true);
                              },
                          highlightedTables: dataModelLayout === 'split' && previewDirection === 3
                            ? (selJoin ? [selJoin.leftTable, selJoin.rightTable] : undefined)
                            : (previewScope === 'join' && previewJoin ? [previewJoin.leftTable, previewJoin.rightTable] : undefined),
                          // Preview icons on cards/join badges — direction 1
                          // shows them (Vivek, 2026-09-23: "add the eye icon
                          // in the explicit preview option"); direction 4 is
                          // the same option WITHOUT them (2026-09-24) — the
                          // card click itself is the trigger. Direction 3
                          // (hidden) keeps them as its only trigger, and
                          // Model-is-home can opt in via secondDoorIcons.
                          ...(dataModelLayout === 'split' && (previewDirection === 1 || previewDirection === 3 || (previewDirection === 2 && secondDoorIcons)) ? {
                            onPreviewTable: previewTableExplicit,
                            // Direction 3's join preview lives in the badge
                            // menu (2026-09-25, Vivek: "remove this eye icon
                            // because it's now inside the menu") — no
                            // standalone eye beside the join badge there.
                            ...(previewDirection !== 3 ? { onPreviewJoin: previewJoinExplicit } : {}),
                          } : {}),
                          hoverAffordance: true,
                          // No clickPrimary (2026-09-25, Vivek): the card body
                          // has no click action — only the eye and ••• act —
                          // so no pointer cursor. The product skin shows a
                          // plain arrow at rest; grabbing still appears
                          // during an actual drag.
                          onCreateJoin: (from: string, to?: string) => setJoinDraft({ left: from, right: to }),
                          onTableMenu: (name: string, e: React.MouseEvent) => {
                            const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            setTableCardMenu({ name, x: r.left, y: r.bottom });
                          },
                          // Option 2 only: a card with no columns yet offers an
                          // "Add columns" link that expands it in the left pane.
                          ...(tableSelectorOption === 2 ? { onAddColumns: (name: string) => setOpenTableV2(name) } : {}),
                        } : {})}
                      />
                      )}
                      {tableCanvasData.tables.length > 0 && tabOption === 3 && option3EmbedMode === 'optimized' && (
                        <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 20, display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                          {/* Directions 1 and 3 only: the model's canvas route
                              (direction 2 doesn't need one — background click
                              zooms out to it). An explicit preview ask, so it
                              also opens a closed panel. */}
                          {dataModelLayout === 'split' && previewDirection !== 2 && (
                            <Button
                              variant="secondary"
                              // `eye`, the preview icon used everywhere else
                              // (table cards, join menu) — 2026-09-28, Komal:
                              // "use the correct preview icon thats used
                              // everywhere" (was `table`).
                              icon={<Icon name="eye" size="s" />}
                              onClick={() => {
                                setPreviewTable(''); setPreviewJoin(null);
                                setSelTable(''); setSelJoin(null);
                                setPreviewScope('model');
                                setPreviewOpen(true);
                              }}
                              // One recipe for all three canvas controls
                              // (2026-09-25): white pill, soft shadow, no
                              // border (Vivek: "we can remove borders").
                              // White background lives in .canvas-preview-btn (dme.css),
                              // not inline, so its :hover can override it.
                              className="canvas-preview-btn"
                              style={{ border: 'none', borderRadius: 'var(--radius-full, 999px)', boxShadow: 'var(--shadow-surface)' }}
                            >
                              Preview model data
                            </Button>
                          )}
                          <Button variant="secondary" iconOnly icon="search" aria-label="Find" style={{ background: 'var(--rd-sys-color-background-base)', border: 'none', borderRadius: 'var(--radius-full, 999px)', boxShadow: 'var(--shadow-surface)' }}>Find</Button>
                          <div style={{ position: 'relative' }}>
                            <Button
                              ref={zoomMenuBtnRef}
                              variant="tertiary"
                              size="basic"
                              iconPosition="trailing"
                              icon={<Icon name={zoomMenuOpen ? 'chevron-up' : 'chevron-down'} size="s" color="var(--rd-sys-color-content-secondary)" />}
                              onClick={() => setZoomMenuOpen(o => !o)}
                              // More breathing room before "100%" (2026-09-25,
                              // Vivek) — the tertiary recipe sits the label too
                              // close to the pill's left edge.
                              style={{ border: 'none', borderRadius: 'var(--radius-full, 999px)', color: 'var(--rd-sys-color-content-primary)', background: 'var(--rd-sys-color-background-base)', boxShadow: 'var(--shadow-surface)', paddingLeft: 'var(--spacing-4)' }}
                            >
                              100%
                            </Button>
                            <AnchoredMenu
                              open={zoomMenuOpen}
                              anchorRef={zoomMenuBtnRef}
                              onClose={() => setZoomMenuOpen(false)}
                              placement="bottom-start"
                            >
                              <Menu onClose={() => setZoomMenuOpen(false)}>
                                <Menu.Item shortcut="⌘1" onClick={() => setZoomMenuOpen(false)}>Zoom to fit</Menu.Item>
                                <Menu.Item shortcut="⌘+" onClick={() => setZoomMenuOpen(false)}>Zoom in</Menu.Item>
                                <Menu.Item shortcut="⌘-" onClick={() => setZoomMenuOpen(false)}>Zoom out</Menu.Item>
                                <Menu.Item onClick={() => setZoomMenuOpen(false)}>Zoom to 50%</Menu.Item>
                                <Menu.Item shortcut="⌘0" onClick={() => setZoomMenuOpen(false)}>Zoom to 100%</Menu.Item>
                                <Menu.Item onClick={() => setZoomMenuOpen(false)}>Zoom to 200%</Menu.Item>
                              </Menu>
                            </AnchoredMenu>
                          </div>
                        </div>
                      )}
                    </div>
                    {tabOption === 3 ? (
                      <PreviewPanel3
                        tables={tableCanvasData.tables}
                        columnRows={columnRows}
                        dataSourceTables={columnTreeData.dataSourceTables}
                        modelColumns={columnTreeData.modelColumns}
                        modelFormulas={modelFormulas}
                        open={previewOpen} setOpen={setPreviewOpen}
                        full={previewFull} setFull={setPreviewFull}
                        height={previewHeight} setHeight={setPreviewHeight}
                        panelTab={panelTab} setPanelTab={setPanelTab}
                        scope={dataModelLayout === 'split' ? previewScope : previewScope === 'none' ? 'model' : previewScope}
                        setScope={setPreviewScope}
                        // Direction 3 decouples canvas selection from preview,
                        // but an explicit pick in the panel's scope dropdown is
                        // a preview that also selects — mirror it into the
                        // canvas highlight so the two never disagree.
                        selectedTable={previewTable}
                        setSelectedTable={name => {
                          setPreviewTable(name);
                          if (dataModelLayout === 'split' && previewDirection === 3) { setSelTable(name); if (name) setSelJoin(null); }
                        }}
                        join={previewJoin}
                        setJoin={j => {
                          setPreviewJoin(j);
                          if (dataModelLayout === 'split' && previewDirection === 3) { setSelJoin(j); if (j) setSelTable(''); }
                        }}
                        joins={tableCanvasData.joins}
                        embedMode={option3EmbedMode}
                        hideQueryTab={dataModelLayout === 'split'}
                        // Directions 1 and 2 share the refresh defaults (Vivek,
                        // 2026-09-23: "refresh should be there even when model
                        // is not home"). Direction 3 is 'explicit': manual
                        // refresh for EVERY scope — modifying whatever is
                        // being previewed shows a "needs refresh" banner, and
                        // removing it is an error state ("it goes hand in hand
                        // with explicit user selection").
                        // The two mental models: Model-is-home = automatic
                        // (auto refresh, cached returns); everything else =
                        // user-controlled ('explicit': every load is a click,
                        // modifications raise the needs-refresh banner,
                        // removals are errors).
                        previewBehavior={dataModelLayout === 'split' ? (
                          previewDirection === 2
                            ? { refresh: 'auto', reentry: 'cached' }
                            : { refresh: 'explicit', reentry: 'fresh' }
                        ) : undefined}
                        // Split creation options: grid-born formulas/filters
                        // write into the same stores the left panel's Formula/
                        // Filters docks render, so both surfaces stay two views
                        // of one model.
                        modelCreation={dataModelLayout === 'split' ? {
                          mode: creationMode,
                          formulaNames: modelFormulas.map(f => f.name),
                          filters: modelFilters,
                          filterEditRequest: filterEditReq,
                          onFormulaAdd: f => setModelFormulas(prev => {
                            const at = prev.findIndex(x => x.name === f.name);
                            if (at === -1) return [...prev, f];
                            const next = prev.slice(); next[at] = f; return next;
                          }),
                          onFormulaRemove: name => setModelFormulas(prev => prev.filter(x => x.name !== name)),
                          onFormulaRename: (oldName, newName) => setModelFormulas(prev => prev.map(x => x.name === oldName ? { ...x, name: newName } : x)),
                          onFilterAdd: f => setModelFilters(prev => [...prev.filter(x => x.col !== f.col), f]),
                          onFilterRemove: col => setModelFilters(prev => prev.filter(x => x.col !== col)),
                          onDraftsChange: setSheetDrafts,
                        } : undefined}
                      />
                    ) : (
                      <PreviewPanel
                        tables={tableCanvasData.tables}
                        columnRows={columnRows}
                        dataSourceTables={columnTreeData.dataSourceTables}
                        open={previewOpen} setOpen={setPreviewOpen}
                        full={previewFull} setFull={setPreviewFull}
                        height={previewHeight} setHeight={setPreviewHeight}
                        panelTab={panelTab} setPanelTab={setPanelTab}
                        scope={previewScope === 'join' ? 'table' : previewScope === 'none' ? 'model' : previewScope} setScope={setPreviewScope}
                        selectedTable={previewTable} setSelectedTable={setPreviewTable}
                      />
                    )}
                  </div>
                ) : (
                  <div className="model-canvas" id="tables-canvas">
                    <TableCanvas
                      tables={tableCanvasData.tables}
                      joins={tableCanvasData.joins}
                      onTableDragEnd={(name, x, y) => (window as any)._handleTableDrag?.(name, x, y)}
                    />
                  </div>
                )}
              </div>

              {/* Columns tab */}
              <div className="tab-content" id="content-columns" style={{ display: 'none' }}>
                <div className="empty-state" id="columns-empty-state">
                  <img src="/spotter-assets/Table=l.svg" width="32" height="32" alt="table icon" />
                  <div className="empty-body">
                    <div className="empty-title">Build your foundation first</div>
                    <div className="empty-desc">Add tables so SpotterModel can recommend the right columns for you</div>
                  </div>
                  <div className="suggestion-row">
                    <a className="suggestion-link" href="#">
                      <img src="/spotter-assets/ai icon.svg" width="14" height="14" alt="ai icon" />
                      Get table suggestions
                    </a>
                    <img className="moving-arrow" src="/spotter-assets/Moving arrow.svg" width="14" height="12" alt="arrow" />
                  </div>
                </div>
                {columnRows.length > 0 && (
                  <div className="col-table-wrap" id="columns-canvas">
                    <div className="col-table-topbar">
                      <SearchInput
                        placeholder="Search"
                        value={colSearch}
                        onChange={(e) => setColSearch(e.target.value)}
                        className="col-table-search-input"
                      />
                      <Button variant="secondary">Model CSV import</Button>
                    </div>
                    <Table
                      columns={COL_TABLE_COLUMNS}
                      data={columnRows.filter(r =>
                        !colSearch ||
                        r.col.toLowerCase().includes(colSearch.toLowerCase()) ||
                        r.table.toLowerCase().includes(colSearch.toLowerCase())
                      )}
                      rowKey={(r) => `${(r as ColRow).table}.${(r as ColRow).col}`}
                      selectable
                      selectedKeys={selectedColKeys}
                      onSelectionChange={setSelectedColKeys}
                      stickyHeader
                    />
                  </div>
                )}
              </div>

              {/* Formulas tab */}
              <div className="tab-content" id="content-formulas" style={{ display: 'none' }}>
                <div className="empty-state" id="formulas-empty-state">
                  <img src="/spotter-assets/Table=l.svg" width="32" height="32" alt="table icon" />
                  <div className="empty-body">
                    <div className="empty-title">Start with a data source</div>
                    <div className="empty-desc">Tables and columns are required before SpotterModel can help you build formulas</div>
                  </div>
                  <div className="suggestion-row">
                    <a className="suggestion-link" href="#">
                      <img src="/spotter-assets/ai icon.svg" width="14" height="14" alt="ai icon" />
                      Get table suggestions
                    </a>
                    <img className="moving-arrow" src="/spotter-assets/Moving arrow.svg" width="14" height="12" alt="arrow" />
                  </div>
                </div>
                {formulaRows.length > 0 && (
                  <div className="formula-table-wrap" id="formulas-canvas">
                    <div className="formula-topbar">
                      <SearchInput
                        placeholder="Search formulas"
                        value={formulaSearch}
                        onChange={(e) => setFormulaSearch(e.target.value)}
                        className="formula-search-input"
                      />
                    </div>
                    <Table
                      columns={[
                        { key: 'name', label: 'Formula name' },
                        { key: 'type', label: 'Data type' },
                        { key: 'actions', label: '', width: '40px', render: (_: unknown, _row: Record<string, unknown>) => (
                          <Button variant="secondary" icon="more" iconOnly title="More options">More options</Button>
                        )},
                      ]}
                      data={formulaRows.filter(r =>
                        !formulaSearch ||
                        r.name.toLowerCase().includes(formulaSearch.toLowerCase())
                      )}
                      rowKey={(r) => (r as FormulaRow).name}
                      stickyHeader
                    />
                  </div>
                )}
              </div>

              {/* Formulas toolbar */}
              <div className="formulas-toolbar" id="formulas-toolbar" style={{ display: 'none' }}>
                <Button variant="secondary" id="formulas-add-btn">Add formula</Button>
              </div>

              {/* Query tab (Option 1) — ported Search + Spreadsheet experience */}
              <div className="tab-content" id="content-query" style={{ display: 'none' }}>
                <SearchDataExplorations showSpotter={false} />
              </div>

              {/* Query tab ("Split" layout only) — QueryAsIs, brought over
                  byte-for-byte from the worksheet 2 source (see
                  components/QueryAsIs.tsx), rendered content-only. Reachable
                  only when the Combined/Split switcher above adds this pill
                  to the tab list — unreachable, so inert, whenever
                  dataModelLayout is 'combined'. */}
              <div className="tab-content" id="content-query-asis" style={{ display: 'none' }}>
                {/* 2026-09-29, Komal: "The Query tab should talk to the model
                    the user is building" — the same tables, joins and added
                    columns the canvas and Spreadsheet read, plus the model's
                    formulas and parameters. */}
                <QueryAsIs
                  queryModel={{
                    tables: tableCanvasData.tables,
                    joins: tableCanvasData.joins,
                    dataSourceTables: columnTreeData.dataSourceTables,
                    modelColumns: columnTreeData.modelColumns,
                    formulas: modelFormulas,
                    parameters: modelParameters,
                  }}
                />
              </div>

            </div>{/* /main-content */}
            {/* AGENT PANEL — hidden entirely on the Query tab, which needs the
                width for its own full search/sheet experience. The collapse
                toggle instead animates this wrapper's width to 0 (kept
                mounted, like #left-pane's own collapse), so it visually
                shrinks away in sync with the left pane and the Optimized
                preview panel instead of vanishing instantly.

                Sits inside .content-row — not beside .left-and-main — so it
                starts below the sub-header like the left pane does, leaving
                the sub-header full width. position/z-index keep it above
                .content-row's absolutely-positioned model-loading overlay,
                which covered only the canvas before this move. */}
            {spotterModelEnabled && activeTab !== 'query' && activeTab !== 'query-asis' && (
              <div
                style={{
                  width: agentPanelCollapsed ? 0 : undefined,
                  overflow: 'hidden',
                  flexShrink: 0,
                  position: 'relative',
                  zIndex: 1,
                  // Same shadow the bottom preview panel shows when expanded
                  // (Komal, 2026-09-17: "all the panels... should use the same
                  // shadow"). Applied here, on this wrapper, rather than via
                  // the shared _agentic/AgentPanel.tsx's own .agent-panel
                  // class — that class sits INSIDE this wrapper, and the
                  // wrapper's own overflow:hidden (needed for the width-to-0
                  // collapse animation) would clip a shadow painted by a
                  // descendant. A shadow on the wrapper itself isn't clipped
                  // by its own overflow, so it paints correctly.
                  boxShadow: 'var(--shadow-surface)',
                  transition: 'width var(--duration-slow) var(--easing-standard)',
                  // This wrapper was a plain block, so .agent-panel inside it
                  // sized to its content — 460px in a 940px column — and its
                  // body's own `justify-content: center` had nothing to centre
                  // against, leaving the welcome content stranded at the top
                  // (2026-09-22, Komal: "centre the main content in the
                  // panel"). As a flex row the panel stretches to full height
                  // and that existing rule does the rest.
                  display: 'flex',
                }}
              >
                <AgentPanel welcomeVariant={welcomeVariant} hideContextChip radianceBackground onClose={() => setAgentPanelCollapsed(true)} />
              </div>
            )}

          </div>{/* /content-row */}
        </div>{/* /left-and-main */}

      </div>{/* /body-row */}

      {/* APP FOOTER — hidden in Optimized to reclaim canvas height; its
          Discard/Save actions already live in the Optimized sub-header
          (Exit/Save changes), and the review-only option switcher moves to
          a popover off the sub-header's settings icon instead (see below). */}
      {!(tabOption === 3 && option3EmbedMode === 'optimized') && (
        <div className="app-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
            <Button variant="secondary" id="discard-btn">Discard changes and close</Button>
          </div>
          <Button variant="primary" id="save-changes-btn">Save model</Button>
        </div>
      )}

      {/* CONTEXT MODAL */}
      {ctxOpen && (
        <RdModal
          size="M2"
          title="Context"
          onClose={() => { (window as any)._onCtxModalClose?.(); }}
          confirmLabel="Done"
          onConfirm={() => { (window as any)._onCtxModalClose?.(); }}
        >
          <div id="ctx-modal-body" className="ctx-modal-body" dangerouslySetInnerHTML={{ __html: ctxHtml }} />
        </RdModal>
      )}

      {/* FORMULA EDITOR — opened from the left pane's "Add formula" link */}
      <AnchoredMenu
        open={!!tableCardMenu}
        anchorPoint={tableCardMenu ? { x: tableCardMenu.x, y: tableCardMenu.y } : null}
        onClose={() => setTableCardMenu(null)}
        placement="bottom-start"
      >
        {/* Product's table-card menu (2026-09-25, Vivek's screenshot).
            Remove table is LAST — same rule the filter menu follows, the
            destructive action never sits mid-list (2026-09-25: "remove
            should be last option in this"). Dividers stay (his call the same
            day). Create alias and Show join recommendation are
            present-for-parity — no machinery behind either. */}
        <Menu className="sm-canvas-menu" onClose={() => setTableCardMenu(null)}>
          <Menu.Item onClick={() => { if (tableCardMenu) setJoinDraft({ left: tableCardMenu.name }); setTableCardMenu(null); }}>
            Add join
          </Menu.Item>
          <Menu.Item onClick={() => setTableCardMenu(null)}>
            Create alias
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item onClick={() => setTableCardMenu(null)}>
            Show join recommendation
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item onClick={() => { if (tableCardMenu) handleRemoveTable(tableCardMenu.name); setTableCardMenu(null); }}>
            Remove table
          </Menu.Item>
        </Menu>
      </AnchoredMenu>

      {formulaEditorOpen && (
        <FormulaEditorModal
          initial={editingFormula ?? undefined}
          onCancel={() => { setFormulaEditorOpen(false); setEditingFormula(null); }}
          onSave={f => {
            setModelFormulas(prev => {
              // Editing keeps the row where it was; adding appends.
              const at = editingFormula ? prev.findIndex(x => x.name === editingFormula.name) : -1;
              if (at === -1) return [...prev.filter(x => x.name !== f.name), f];
              const next = prev.slice();
              next[at] = f;
              return next;
            });
            setFormulaEditorOpen(false);
            setEditingFormula(null);
          }}
        />
      )}

      {/* SAVE REVIEW MODAL (2026-09-25, Vivek): model name + description, and
          the UNSAVED spreadsheet changes — filters and formulas not yet in
          the model, each with a checkbox (default checked — the sweep exists
          so work isn't silently lost), a Select all, and one list per kind
          (his spec, same day: "more structured view — Filters list, Formula
          list; we only show unsaved ones; make the modal bigger, wider").
          Save promotes the checked ones; Dismiss closes without saving. */}
      {saveReviewOpen && (
        <RdModal
          size="M2"
          title="Save model"
          onClose={() => setSaveReviewOpen(false)}
          cancelLabel="Dismiss"
          onCancel={() => setSaveReviewOpen(false)}
          confirmLabel="Save"
          onConfirm={() => {
            sheetDrafts.filters.forEach(f => {
              if (saveChecks[`f:${f.col}`]) setModelFilters(prev => [...prev.filter(x => x.col !== f.col), f]);
            });
            sheetDrafts.formulas.forEach(x => {
              if (saveChecks[`x:${x.name}`]) setModelFormulas(prev => prev.some(m => m.name === x.name) ? prev : [...prev, x]);
            });
            (window as any)._showToast?.('Changes saved');
            setSaveReviewOpen(false);
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            <div>
              <Typography variant="content-label-subhead" as="div" style={{ marginBottom: 'var(--spacing-2)' }}>Model name</Typography>
              <TextInput value={saveModelName} onChange={e => setSaveModelName(e.target.value)} showLabel={false} />
            </div>
            <div>
              <Typography variant="content-label-subhead" as="div" style={{ marginBottom: 'var(--spacing-2)' }}>Description</Typography>
              <TextArea value={saveModelDesc} onChange={e => setSaveModelDesc(e.target.value)} placeholder="Add a description" rows={2} />
            </div>
            {/* The whole section drops out when there is nothing unsaved
                (2026-09-25, Vivek) — a heading plus "nothing here" is noise
                in the common case where Save is just Save. */}
            {(sheetDrafts.filters.length > 0 || sheetDrafts.formulas.length > 0) && (
            <div>
              <Typography variant="content-label-subhead" as="div" style={{ marginBottom: 'var(--spacing-1)' }}>Unsaved spreadsheet changes</Typography>
              {(() => {
                const allKeys = [
                  ...sheetDrafts.filters.map(f => `f:${f.col}`),
                  ...sheetDrafts.formulas.map(x => `x:${x.name}`),
                ];
                const allChecked = allKeys.every(k => !!saveChecks[k]);
                const setAll = (v: boolean) => setSaveChecks(prev => {
                  const next = { ...prev };
                  allKeys.forEach(k => { next[k] = v; });
                  return next;
                });
                // Boxless, quieter hierarchy (2026-09-25, Vivek: "don't need
                // a box for these... these font size and all are not good"):
                // grey caption sub-heads, regular-weight rows (name primary,
                // value secondary — no bold), Select all split off by a
                // divider.
                // 14px throughout (2026-09-25, Vivek: "I find them too small")
                // — footnote/caption are 12px, which sat below the rest of the
                // modal and below the sheet's own 14px floor. Hierarchy comes
                // from weight and colour now, not size.
                const draftRow = (key: string, name: string, val: string) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                    <Checkbox
                      checked={!!saveChecks[key]}
                      onChange={v => setSaveChecks(prev => ({ ...prev, [key]: v }))}
                      showLabel={false}
                    />
                    <Typography variant="body-normal" as="span" style={{ fontWeight: 'var(--font-weight-light)' }}>{name}</Typography>
                    <Typography variant="body-normal" color="gray" as="span" style={{ fontWeight: 'var(--font-weight-light)' }}>{val}</Typography>
                  </div>
                );
                return (
                  <>
                    {/* Copy is Vivek's, verbatim (2026-09-25). Light 375 so it
                        reads as supporting text, not a second title — at
                        regular 400 it sat only one weight step under the
                        section header and the two ran together ("it reads
                        same as title"). */}
                    <Typography variant="body-normal" color="gray" as="div" style={{ fontWeight: 'var(--font-weight-light)', marginBottom: 'var(--spacing-3)' }}>
                      Checked changes are added to the model when you save.
                    </Typography>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)', maxHeight: 320, overflowY: 'auto' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                        <Checkbox checked={allChecked} onChange={setAll} showLabel={false} />
                        <Typography variant="body-normal" as="span" style={{ fontWeight: 'var(--font-weight-light)' }}>Select all</Typography>
                      </div>
                      <Divider />
                      {sheetDrafts.filters.length > 0 && (
                        <>
                          <Typography variant="body-normal" as="div" style={{ marginTop: 'var(--spacing-1)' }}>Filters</Typography>
                          {sheetDrafts.filters.map(f => draftRow(`f:${f.col}`, f.col, f.val))}
                        </>
                      )}
                      {sheetDrafts.formulas.length > 0 && (
                        <>
                          <Typography variant="body-normal" as="div" style={{ marginTop: 'var(--spacing-2)' }}>Formulas</Typography>
                          {sheetDrafts.formulas.map(x => draftRow(`x:${x.name}`, x.name, x.expression))}
                        </>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
            )}
          </div>
        </RdModal>
      )}

      {/* JOIN MENU — join badge click, eye-icon direction only (2026-09-25).
          Preview is first with the eye; Edit/Delete are the product's
          existing join-click pair. Delete goes through _removeJoinManually;
          a previewed-then-deleted join lands in the preview's own
          "No longer in the model" state. */}
      <AnchoredMenu
        open={!!joinMenu}
        anchorPoint={joinMenu ? { x: joinMenu.x, y: joinMenu.y } : null}
        onClose={() => setJoinMenu(null)}
        placement="bottom-start"
      >
        <Menu className="sm-canvas-menu" onClose={() => setJoinMenu(null)}>
          {/* Leading icons (2026-09-28, Komal: "add icons here on the
              left") — Radiant registry glyphs through Menu.Item's own `icon`
              slot, size m = the slot's 16px box. Preview uses the same `eye`
              the table cards' preview icon uses. */}
          <Menu.Item icon={<Icon name="eye" size="m" color="currentColor" />} onClick={() => { if (joinMenu) previewJoinExplicit(joinMenu.j); setJoinMenu(null); }}>
            Preview data
          </Menu.Item>
          <Menu.Item icon={<Icon name="pencil" size="m" color="currentColor" />} onClick={() => { if (joinMenu) setJoinDraft({ left: joinMenu.j.leftTable, right: joinMenu.j.rightTable }); setJoinMenu(null); }}>
            Edit join
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item icon={<Icon name="trash-can" size="m" color="currentColor" />} onClick={() => { if (joinMenu) (window as any)._removeJoinManually?.(joinMenu.j.leftTable, joinMenu.j.rightTable); setJoinMenu(null); }}>
            Delete join
          </Menu.Item>
        </Menu>
      </AnchoredMenu>


      {parameterEditorOpen && (
        <ParameterEditorModal
          onCancel={() => setParameterEditorOpen(false)}
          onSave={(p: ParameterDraft) => {
            setModelParameters(prev => [...prev.filter(x => x.name !== p.name), p]);
            setParameterEditorOpen(false);
          }}
        />
      )}

      {/* EDIT JOIN MODAL — opened from a table card's join handle */}
      {joinDraft && (
        <EditJoinModal
          leftTable={joinDraft.left}
          rightTable={joinDraft.right}
          tables={tableCanvasData.tables.map(t => t.name)}
          dataSourceTables={columnTreeData.dataSourceTables}
          onCancel={() => setJoinDraft(null)}
          onSave={(join: EditJoinResult) => {
            (window as any)._addJoinManually?.(join);
            setJoinDraft(null);
          }}
        />
      )}

      {/* TABLE BROWSER MODAL — Tables-section Option 2's only entry point.
          Option 2.1 uses the same state but a different component (the
          inline side panel, rendered as a .content-row sibling near
          #left-pane — see TableColumnSidePanel below). */}
      {tablesNavOption === 2 && (
        <TableBrowserModal
          isOpen={option2ModalOpen}
          onClose={() => setOption2ModalOpen(false)}
          catalog={unifiedTreeData}
          draft={option2Draft}
          onToggleColumn={handleOption2DraftToggle}
          onConfirm={handleOption2Confirm}
          initialFocusTable={option2FocusTable}
          tableInfoMode={tableInfoMode === 'footer' ? 'icon' : tableInfoMode}
        />
      )}
    </div>
  );
};

export default SearchDataOnDataModelFinal;
