import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { bus } from './bus';
import type { Aggregates } from './Grid';
import { Icon } from './ui';
import type { Sheet } from './sheet';

const fmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

export function Footer(props: { sheets: Sheet[]; active: number; agg: Aggregates; onSwitch: (i: number, viaList: boolean) => void; onAdd: () => void }) {
  const strip = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  const [list, setList] = useState(false);
  const [q, setQ] = useState('');
  const [aggPick, setAggPick] = useState<'sum' | 'avg' | 'count'>('sum');
  const [narrow, setNarrow] = useState(false);

  const measureEdges = useCallback(() => {
    const s = strip.current;
    if (!s) return;
    setEdges({ left: s.scrollLeft > 2, right: s.scrollLeft + s.clientWidth < s.scrollWidth - 2 });
  }, []);
  useLayoutEffect(() => {
    measureEdges();
    const ro = new ResizeObserver(() => {
      measureEdges();
      setNarrow((strip.current?.closest('.footer') as HTMLElement | null)?.clientWidth! < 600);
    });
    if (strip.current) ro.observe(strip.current.closest('.footer')!);
    return () => ro.disconnect();
  }, [measureEdges, props.sheets.length]);

  // the active tab is always scrolled into view
  useEffect(() => {
    const el = strip.current?.querySelector<HTMLElement>(`[data-i="${props.active}"]`);
    el?.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' });
    setTimeout(measureEdges, 400);
  }, [props.active, measureEdges]);

  const scrollBy = (d: number) => {
    strip.current?.scrollBy({ left: d, behavior: 'smooth' });
    setTimeout(measureEdges, 350);
    bus.emit({ type: 'tabs-scroll' });
  };

  const { sum, numbers, cells } = props.agg;
  const aggText = { sum: ['Sum', fmt.format(sum)], avg: ['Average', numbers ? fmt.format(sum / numbers) : '—'], count: ['Count', fmt.format(cells)] };
  const shown = props.sheets.map((s, i) => ({ s, i })).filter(({ s }) => s.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <footer className="footer" aria-label="Sheets">
      <button className="fbtn" aria-label="Add an input table sheet" title="Add an input table sheet" onClick={props.onAdd}>
        <Icon name="plus" />
      </button>
      <button
        className={`fbtn${list ? ' on' : ''}`}
        aria-label="All sheets"
        title="All sheets"
        aria-haspopup="dialog"
        aria-expanded={list}
        onClick={() => {
          setList(!list);
          setQ('');
          if (!list) bus.emit({ type: 'tabs-list' });
        }}
      >
        <Icon name="menu" />
      </button>
      <span className="fdiv" />
      {narrow ? (
        <button className="sheetpick" onClick={() => setList(true)}>
          <Icon name={props.sheets[props.active].kind === 'answer' ? 'answer' : 'table'} />
          <span>{props.sheets[props.active].name}</span>
          <Icon name="chev" size={12} />
        </button>
      ) : (
        <div className="stripwrap">
          <div
            className="strip"
            ref={strip}
            role="tablist"
            aria-label="Sheets"
            onScroll={measureEdges}
            onKeyDown={e => {
              const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
              if (!d) return;
              const next = (props.active + d + props.sheets.length) % props.sheets.length;
              props.onSwitch(next, false);
              setTimeout(() => strip.current?.querySelector<HTMLElement>(`[data-i="${next}"]`)?.focus(), 30);
              e.preventDefault();
            }}
          >
            {props.sheets.map((s, i) => (
              <button
                key={s.name}
                data-i={i}
                role="tab"
                aria-selected={i === props.active}
                tabIndex={i === props.active ? 0 : -1}
                className={`tab${i === props.active ? ' on' : ''}${s.state === 'booting' ? ' boot' : ''}`}
                title={s.name.length > 24 ? s.name : undefined}
                disabled={s.state === 'booting'}
                onClick={() => props.onSwitch(i, false)}
              >
                <Icon name={s.state === 'booting' ? 'spin' : s.kind === 'answer' ? 'answer' : 'table'} className={s.state === 'booting' ? 'spin' : s.state === 'error' ? 'terr' : ''} />
                <span className="tn">{s.name}</span>
                {s.state === 'error' && <span className="sr">, couldn't load</span>}
              </button>
            ))}
          </div>
          {edges.left && <i className="fade l" />}
          {edges.right && <i className="fade r" />}
        </div>
      )}
      {!narrow && (edges.left || edges.right) && (
        <>
          <button className="fbtn sm" aria-label="Scroll sheets left" disabled={!edges.left} onClick={() => scrollBy(-260)}>
            <Icon name="left" />
          </button>
          <button className="fbtn sm" aria-label="Scroll sheets right" disabled={!edges.right} onClick={() => scrollBy(260)}>
            <Icon name="right" />
          </button>
        </>
      )}
      <span className="fdiv" />
      <button
        className="agg"
        title="Click to switch between Sum, Average and Count"
        onClick={() => setAggPick(a => (a === 'sum' ? 'avg' : a === 'avg' ? 'count' : 'sum'))}
        aria-label={`${aggText[aggPick][0]} of the selection: ${aggText[aggPick][1]}. Click to switch.`}
      >
        {aggText[aggPick][0]} <b>{aggText[aggPick][1]}</b>
        <Icon name="chev" size={12} />
      </button>
      {list && (
        <div
          className="sheetlist"
          role="dialog"
          aria-label="All sheets"
          onKeyDown={e => {
            if (e.key === 'Escape') setList(false);
          }}
        >
          <label className="search">
            <Icon name="search" />
            <input autoFocus placeholder="Find a sheet" value={q} onChange={e => setQ(e.target.value)} aria-label="Find a sheet" />
            <span className="cnt">{props.sheets.length} sheets</span>
          </label>
          <div className="lis">
            {shown.map(({ s, i }) => (
              <button
                key={s.name}
                className={`li${i === props.active ? ' cur' : ''}`}
                disabled={s.state === 'booting'}
                onClick={() => {
                  setList(false);
                  props.onSwitch(i, true);
                }}
              >
                <Icon name={s.state === 'booting' ? 'spin' : s.kind === 'answer' ? 'answer' : 'table'} className={s.state === 'booting' ? 'spin' : s.state === 'error' ? 'terr' : ''} />
                <span className="tn">{s.name}</span>
                {s.state === 'error' && <span className="lerr">Couldn't load</span>}
                {i === props.active && <Icon name="check" className="ok" />}
              </button>
            ))}
            {!shown.length && <div className="empty">No sheet matches “{q}”</div>}
          </div>
        </div>
      )}
    </footer>
  );
}
