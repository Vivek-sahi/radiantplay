// Small DOM building blocks matching Radiant's look: icons, anchored popovers, menus, the dropdown list,
// the date picker, and the tooltip-style hint bubble.

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { bus, narrate } from './bus';
import { ICON_PATHS } from './icons';
import type { MenuEntry, Option } from './types';
import { isOn, reasonOf } from './types';

export function Icon({ name, size = 16, className = '', title }: { name: string; size?: number; className?: string; title?: string }) {
  if (name === 'error')
    return (
      <svg className={`ic ic-error ${className}`} width={size} height={size} viewBox="0 0 12 12" aria-hidden={!title} role={title ? 'img' : undefined}>
        {title && <title>{title}</title>}
        <circle cx="6" cy="6" r="5.5" fill="currentColor" />
        <path d="M6 3.1v3.4M6 8.5v.1" stroke="var(--kg-cell-background)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  return (
    <svg className={`ic ${className}`} width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden={!title} role={title ? 'img' : undefined}>
      {title && <title>{title}</title>}
      <path d={ICON_PATHS[name] ?? ICON_PATHS.info} />
    </svg>
  );
}

/** Positions a fixed popover under (or above) an anchor element, following scrolls of the grid. */
export function useAnchor(anchor: () => HTMLElement | null, deps: unknown[], width = 0, prefer: 'below' | 'above' = 'below') {
  // starts invisible but focusable (visibility:hidden can't take focus), until it's been placed
  const [style, setStyle] = useState<CSSProperties>({ position: 'fixed', top: 0, left: 0, opacity: 0 });
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const place = () => {
      const a = anchor();
      const el = ref.current;
      if (!a || !el) return;
      const r = a.getBoundingClientRect();
      const h = el.offsetHeight;
      const w = Math.max(width, el.offsetWidth);
      const below = r.bottom + 4 + h <= window.innerHeight || prefer === 'below' && r.top - 4 - h < 0;
      const top = prefer === 'above' ? r.top - 4 - h : below ? r.bottom + 4 : r.top - 4 - h;
      const left = Math.min(Math.max(8, r.left), window.innerWidth - w - 8);
      setStyle({ position: 'fixed', top, left, minWidth: width || undefined });
    };
    place();
    const scrollers = document.querySelectorAll('.kg-scroll');
    scrollers.forEach(s => s.addEventListener('scroll', place));
    window.addEventListener('resize', place);
    return () => {
      scrollers.forEach(s => s.removeEventListener('scroll', place));
      window.removeEventListener('resize', place);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { ref, style };
}

export function Bubble({ anchor, tone, title, body, id, deps }: { anchor: () => HTMLElement | null; tone: 'error' | 'dark'; title: string; body?: ReactNode; id?: string; deps: unknown[] }) {
  const { ref, style } = useAnchor(anchor, deps);
  return (
    <div ref={ref} id={id} className={`kg-pop bubble ${tone}`} style={style} role={tone === 'error' ? 'alert' : 'tooltip'}>
      {tone === 'error' && <Icon name="error" className="err" />}
      <div>
        <b>{title}</b>
        {body && <span>{body}</span>}
      </div>
    </div>
  );
}

/** A Radiant ActionMenu look-alike with full keyboard support; a disabled item shows its reason. */
export function Menu({
  entries, anchor, onPick, onClose, label, deps, header,
}: {
  entries: MenuEntry[];
  anchor: () => HTMLElement | null;
  onPick: (e: MenuEntry) => void;
  onClose: (refocus: boolean) => void;
  label: string;
  deps: unknown[];
  header?: ReactNode;
}) {
  const items = entries.filter(e => !e.divider);
  const [active, setActive] = useState(0);
  const { ref, style } = useAnchor(anchor, deps, 220);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, [ref]);
  useEffect(() => {
    const away = (ev: MouseEvent) => {
      if (ref.current && !ref.current.contains(ev.target as Node)) onClose(false);
    };
    setTimeout(() => document.addEventListener('mousedown', away), 0);
    return () => document.removeEventListener('mousedown', away);
  }, [onClose, ref]);
  const cur = items[active];
  const reason = cur ? reasonOf(cur.enabled) : null;
  useEffect(() => {
    if (cur) narrate(`${cur.label}${reason ? `, unavailable: ${reason}` : ''}`);
    if (reason && cur) bus.emit({ type: 'menu-disabled-seen', label: cur.label });
  }, [reason, cur]);
  return (
    <div
      ref={ref}
      className="kg-pop menu"
      style={style}
      role="menu"
      aria-label={label}
      tabIndex={-1}
      aria-activedescendant={cur ? `mi-${cur.id}` : undefined}
      onKeyDown={e => {
        if (e.key === 'ArrowDown') setActive(a => (a + 1) % items.length);
        else if (e.key === 'ArrowUp') setActive(a => (a - 1 + items.length) % items.length);
        else if (e.key === 'Home') setActive(0);
        else if (e.key === 'End') setActive(items.length - 1);
        else if (e.key === 'Enter' || e.key === ' ') {
          if (cur && isOn(cur.enabled)) onPick(cur);
        } else if (e.key === 'Escape' || e.key === 'Tab') onClose(true);
        else return;
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {header}
      {entries.map((e, i) => {
        if (e.divider) return <div key={`d${i}`} className="mdiv" role="separator" />;
        const idx = items.indexOf(e);
        const enabled = isOn(e.enabled);
        return (
          <div
            key={e.id}
            id={`mi-${e.id}`}
            role="menuitem"
            aria-disabled={!enabled}
            className={`mi${idx === active ? ' on' : ''}${enabled ? '' : ' off'}${e.danger ? ' danger' : ''}`}
            onMouseEnter={() => setActive(idx)}
            onClick={() => enabled && onPick(e)}
          >
            {e.icon && <Icon name={e.icon} />}
            <span>{e.label}</span>
          </div>
        );
      })}
      {reason && (
        <div className="mreason" role="note">
          <Icon name="info" size={14} />
          {reason}
        </div>
      )}
    </div>
  );
}

const TONE_BG: Record<string, string> = { neutral: 'pill-neutral', green: 'pill-green', amber: 'pill-amber', blue: 'pill-blue', purple: 'pill-purple' };
export function Pill({ option, chevron }: { option: Option; chevron?: boolean }) {
  return (
    <span className={`pill ${TONE_BG[option.tone]}`}>
      <i />
      {option.label}
      {chevron && <Icon name="chev" size={12} className="pchev" />}
    </span>
  );
}

/** The dropdown list for dropdown and Yes/No cells: search, arrows, Enter; the current value is ticked. */
export function DropdownList({
  options, value, seed, anchor, onPick, onClose, deps,
}: {
  options: Option[];
  value: string | null;
  seed: string;
  anchor: () => HTMLElement | null;
  onPick: (o: Option, searched: boolean) => void;
  onClose: () => void;
  deps: unknown[];
}) {
  const [q, setQ] = useState(seed);
  const shown = useMemo(() => options.filter(o => o.label.toLowerCase().includes(q.toLowerCase())), [options, q]);
  const [active, setActive] = useState(Math.max(0, options.findIndex(o => o.value === value)));
  const { ref, style } = useAnchor(anchor, deps, 200);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus({ preventScroll: true }), []);
  useEffect(() => setActive(a => Math.min(a, Math.max(0, shown.length - 1))), [shown.length]);
  useEffect(() => {
    const away = (ev: MouseEvent) => {
      if (ref.current && !ref.current.contains(ev.target as Node)) onClose();
    };
    setTimeout(() => document.addEventListener('mousedown', away), 0);
    return () => document.removeEventListener('mousedown', away);
  }, [onClose, ref]);
  return (
    <div ref={ref} className="kg-pop list" style={style} role="dialog" aria-label="Pick a value">
      <label className="search">
        <Icon name="search" />
        <input
          ref={input}
          value={q}
          placeholder="Search"
          role="combobox"
          aria-expanded
          aria-controls="kg-options"
          aria-activedescendant={shown[active] ? `opt-${shown[active].value}` : undefined}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') setActive(a => Math.min(a + 1, shown.length - 1));
            else if (e.key === 'ArrowUp') setActive(a => Math.max(a - 1, 0));
            else if (e.key === 'Enter' || (e.key === 'Tab' && shown[active])) {
              if (shown[active]) onPick(shown[active], q !== seed || q.length > 0);
            } else if (e.key === 'Escape') onClose();
            else return;
            e.preventDefault();
            e.stopPropagation();
          }}
        />
      </label>
      <div id="kg-options" role="listbox" aria-label="Values">
        {shown.map((o, i) => (
          <div
            key={o.value}
            id={`opt-${o.value}`}
            role="option"
            aria-selected={o.value === value}
            className={`opt${i === active ? ' on' : ''}`}
            onMouseEnter={() => setActive(i)}
            onClick={() => onPick(o, q.length > 0)}
          >
            <Pill option={o} />
            {o.value === value && <Icon name="check" className="ok" />}
          </div>
        ))}
        {!shown.length && <div className="empty">No match for “{q}”</div>}
      </div>
    </div>
  );
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const pad = (n: number) => String(n).padStart(2, '0');
const isoOf = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

/** Radiant DatePicker look-alike: arrows move by day/week, PageUp/PageDown by month, Enter picks. */
export function DatePicker({ value, anchor, onPick, onClose, deps }: { value: string | null; anchor: () => HTMLElement | null; onPick: (iso: string) => void; onClose: () => void; deps: unknown[] }) {
  const start = value ? new Date(value + 'T00:00:00Z') : new Date(Date.UTC(2026, 9, 29));
  const [cur, setCur] = useState(start);
  const { ref, style } = useAnchor(anchor, deps, 252);
  useEffect(() => ref.current?.focus({ preventScroll: true }), [ref]);
  useEffect(() => {
    const away = (ev: MouseEvent) => {
      if (ref.current && !ref.current.contains(ev.target as Node)) onClose();
    };
    setTimeout(() => document.addEventListener('mousedown', away), 0);
    return () => document.removeEventListener('mousedown', away);
  }, [onClose, ref]);
  const y = cur.getUTCFullYear();
  const m = cur.getUTCMonth();
  const first = new Date(Date.UTC(y, m, 1));
  const lead = (first.getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const shift = (d: number) => setCur(c => new Date(c.getTime() + d * 86400000));
  const month = (d: number) => setCur(c => new Date(Date.UTC(c.getUTCFullYear(), c.getUTCMonth() + d, Math.min(c.getUTCDate(), 28))));
  return (
    <div
      ref={ref}
      className="kg-pop date"
      style={style}
      role="dialog"
      aria-label={`Choose a date, ${MONTHS[m]} ${y}`}
      tabIndex={-1}
      onKeyDown={e => {
        const k = e.key;
        if (k === 'ArrowLeft') shift(-1);
        else if (k === 'ArrowRight') shift(1);
        else if (k === 'ArrowUp') shift(-7);
        else if (k === 'ArrowDown') shift(7);
        else if (k === 'PageUp') month(-1);
        else if (k === 'PageDown') month(1);
        else if (k === 'Enter' || k === ' ') onPick(isoOf(cur));
        else if (k === 'Escape' || k === 'Tab') onClose();
        else return;
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div className="dhead">
        <button type="button" aria-label="Previous month" onClick={() => month(-1)}>
          <Icon name="left" />
        </button>
        <b aria-live="polite">{MONTHS[m]} {y}</b>
        <button type="button" aria-label="Next month" onClick={() => month(1)}>
          <Icon name="right" />
        </button>
      </div>
      <div className="dgrid" role="grid">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
          <span key={d} className="dow" role="columnheader">{d}</span>
        ))}
        {Array.from({ length: lead }, (_, i) => <span key={`l${i}`} />)}
        {Array.from({ length: days }, (_, i) => {
          const d = new Date(Date.UTC(y, m, i + 1));
          const iso = isoOf(d);
          return (
            <button
              type="button"
              key={iso}
              role="gridcell"
              aria-selected={iso === value}
              className={`day${iso === isoOf(cur) ? ' on' : ''}${iso === value ? ' val' : ''}`}
              onClick={() => onPick(iso)}
              tabIndex={-1}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <div className="dfoot">Arrows move · Enter picks · Esc closes</div>
    </div>
  );
}
