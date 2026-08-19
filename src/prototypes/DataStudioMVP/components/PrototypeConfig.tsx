import React, { useEffect, useRef, useState } from 'react';
import { c, sp, fs, fw, ff } from '../styles';
import { Icon } from '@components/icons';

/**
 * **UX concepts** — the configurator, brought into the prototype.
 *
 * A fixed-title menu of design decisions, each a section with its own options, switchable
 * live. The point is the same as the standalone configurator's: show an option instead of
 * describing it, so stakeholders compare screens rather than arguments. Sections accumulate
 * as decisions come up — Data panel first, spreadsheet next.
 *
 * ⚠️ **The trigger says "UX concepts", never the active option.** It holds many decisions;
 * naming one of them on the button would misdescribe the control as soon as a second
 * section lands.
 *
 * ⚠️ **Platform chrome, not canvas chrome.** It lives in the `GlobalHeader`, beside search
 * and the avatar, because it configures the prototype rather than the model being edited —
 * the same place `DataStudioV2` put its `VariantToggle`. It is deliberately not in the
 * canvas topbar, where it read as a model action sitting next to Save.
 *
 * ⚠️ **This is not the old variant system coming back.** `DataStudioV2` resolved four whole
 * product cuts through one `isPocCut` boolean feeding ~28 checks, and that is what the
 * extraction deleted. What this drives is one named field per decision, which is the shape
 * `DESIGN.md` endorsed.
 *
 * **To add a decision:** add its field to `ConfigValues`, add a `SECTIONS` entry, and read
 * it wherever it applies. The menu renders itself from the data. Labels only — the options
 * are meant to be *shown*, so the screen behind the menu is the explanation.
 */

/** One switchable decision per field. Keep these named after the decision, not the cut. */
export interface ConfigValues {
  /**
   * How the left dock is arranged.
   * - `browser` — the data browser alone; no model view. Drives `SCOPE.fieldsPane` false.
   * - `tabs`    — browser and model view sharing one dock, via a segmented control.
   * - `single`  — both in one scrolling panel, sectioned. ⚠️ **Agreed, not yet built** —
   *   listed in the menu as disabled so the option is visible without pretending to work.
   */
  dataPanel: 'browser' | 'tabs' | 'single';
  /**
   * How the data surface is arranged — **the open question is where formulas get made.**
   *
   * - `one` — one object. The spreadsheet, docked under the canvas and full screen, same
   *   chrome either way. Docked spends ~120px on a toolbar and a formula bar before the
   *   first row, which is most of a short pane, and it makes the docked pane *actionable* —
   *   a property the preview was originally specified not to have.
   * - `preview` — the earlier shape, restored. A **Canvas / Spreadsheet** switcher; docked
   *   is a **data preview** with no actions at all, each column carrying a sort control
   *   rather than a menu; **Semantic lives in the preview**. Everything you *do* — formulas,
   *   filters — happens in the Spreadsheet.
   *
   * ⚠️ **This is up for research, not decided** (Vivek, 2026-08-19). The hypothesis the two
   * options test: a preview is what you want for *a table*, and the spreadsheet is what you
   * want for adding formulas *at model level*. Build both, then find out.
   */
  spreadsheet: 'one' | 'preview';
}

/**
 * The concepts we are going with: browser and model view as tabs, and the spreadsheet as one
 * surface docked and full screen. Both are what the menu below would default to anyway — they
 * are stated here because with the menu hidden this is the only place they are chosen.
 */
export const DEFAULT_CONFIG: ConfigValues = { dataPanel: 'tabs', spreadsheet: 'one' };

/**
 * ⚠️ **The menu is hidden, not removed** (Vivek, 2026-08-19: "if I want to bring it back then
 * I'll ask to make it visible again — don't delete anything").
 *
 * Every option, every section and every branch they drive is intact and still working; only the
 * trigger is withheld, so the prototype runs on `DEFAULT_CONFIG` and stakeholders see one
 * experience rather than a switch. **Flip this to `true` to bring it back** — there is nothing
 * else to restore.
 */
const MENU_VISIBLE = false;

interface Option<V extends string> {
  value: V;
  label: string;
  /** Listed but not selectable — the option exists as a decision, not yet as a build. */
  disabled?: boolean;
}

/**
 * A union over the keys of `ConfigValues`, so each section's options are checked against
 * *its own* field. Declaring `key: keyof ConfigValues` instead would let the Data panel
 * section list a value belonging to some future decision, and nothing would catch it.
 */
type Section = {
  [K in keyof ConfigValues]: { key: K; label: string; options: Option<ConfigValues[K]>[] }
}[keyof ConfigValues];

const SECTIONS: Section[] = [
  {
    key: 'dataPanel',
    label: 'Data panel',
    options: [
      { value: 'browser', label: 'Data browser only' },
      { value: 'tabs',    label: 'Browser and model view as tabs' },
      { value: 'single',  label: 'Browser and model view in one panel', disabled: true },
    ],
  },
  {
    key: 'spreadsheet',
    label: 'Data surface',
    options: [
      { value: 'one',     label: 'Spreadsheet, docked and full screen' },
      { value: 'preview', label: 'Data preview and spreadsheet as tabs' },
    ],
  },
];

export interface PrototypeConfigProps {
  value: ConfigValues;
  onChange: (next: ConfigValues) => void;
}

const PrototypeConfig: React.FC<PrototypeConfigProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  // After the hooks, never before — bailing earlier would make hook order depend on a flag.
  if (!MENU_VISIBLE) return null;

  return (
    <div ref={wrapRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="UX concepts under review"
        style={{
          display: 'flex', alignItems: 'center', gap: sp.A,
          height: 28, padding: `0 ${sp.C}px`, borderRadius: 14,
          border: `1px solid ${c['border-default']}`,
          background: open ? c['background-subtle'] : 'transparent',
          color: c['content-secondary'],
          fontSize: fs.xs, fontWeight: fw.medium, fontFamily: ff.primary,
          cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        <Icon name="settings" size="xs" color="currentColor" />
        {/* A fixed title, never the active option. The menu holds many decisions, so naming
            one of them here would misdescribe the control the moment a second section lands. */}
        <span>UX concepts</span>
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4,6 8,10 12,6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute', top: 34, left: 0, zIndex: 80,
            minWidth: 288, padding: sp.A,
            background: c['background-base'],
            border: `1px solid ${c['border-default']}`,
            borderRadius: 8,
            boxShadow: '0 12px 32px rgba(0,0,0,0.16)',
          }}
        >
          {SECTIONS.map(section => (
            <div key={section.key}>
              <div style={{
                fontSize: fs.xs, fontWeight: fw.semibold, color: c['content-secondary'],
                fontFamily: ff.primary, padding: `${sp.B}px ${sp.C}px ${sp.A}px`,
              }}>
                {section.label}
              </div>

              {section.options.map(opt => {
                const active = value[section.key] === opt.value;
                return (
                  <button
                    key={opt.value}
                    role="menuitemradio"
                    aria-checked={active}
                    disabled={opt.disabled}
                    onClick={() => {
                      /* One cast, and only here: TypeScript will not narrow a computed key
                         across a union of sections. Safe by construction — the `Section`
                         type above already pairs each key with only its own values. */
                      onChange({ ...value, [section.key]: opt.value } as ConfigValues);
                      setOpen(false);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: sp.B,
                      width: '100%', textAlign: 'left',
                      padding: `${sp.B}px ${sp.C}px`,
                      border: 'none', borderRadius: 6,
                      cursor: opt.disabled ? 'default' : 'pointer',
                      background: active ? c['background-information'] : 'transparent',
                      fontSize: fs.xs, fontFamily: ff.primary,
                      fontWeight: active ? fw.semibold : fw.regular,
                      color: opt.disabled ? c['content-tertiary']
                           : active ? c['content-brand'] : c['content-primary'],
                    }}
                    onMouseEnter={e => { if (!active && !opt.disabled) e.currentTarget.style.background = c['background-subtle']; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* A fixed-width tick column, so the labels align whether ticked or not */}
                    <span style={{ width: 12, flexShrink: 0, display: 'flex' }}>
                      {active && <Icon name="checkmark" size="xs" color="currentColor" />}
                    </span>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PrototypeConfig;
