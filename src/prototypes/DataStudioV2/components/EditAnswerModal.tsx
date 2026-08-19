import React from 'react';
import ReactECharts from 'echarts-for-react';
import { c, sp, ff, fs, fw } from '../styles';

/**
 * Edit Answer — the ThoughtSpot "Search data" answer editor, as a modal.
 *
 * Dataset dropdown, token search bar, column picker, the answer as a chart or a table,
 * viz-type rail, Discard / Done. The controls are presentational: this is the surface
 * where you'd see and change which columns and tokens produced an answer, and the point
 * of showing it is that the answer is *editable data*, not a black box.
 *
 * Lifted out of AgentPanel so the readiness flow can open the same editor from a Spotter
 * check's Edit action. It was hardcoded to a retail sample — measures `sales`, attributes
 * `city`/`SKU`, a five-region bar — which is fine as the tuning card's illustration and
 * wrong for a renewal-risk question. Everything the screen says is now a prop, so both
 * callers get the same UI over their own data.
 *
 * Surface treatment follows the product: the header and toolbar sit on white, and the
 * body below is a sunken grey with the picker, the answer and the rail as three separate
 * cards floating on it. Flush panels divided by hairlines read as one dense form; the
 * card separation is what makes the answer feel like an object you're editing.
 */

const SUNKEN = '#F6F8FA';
const CARD_BORDER = c['border-divider'];
const CARD_SHADOW = '0 1px 2px rgba(25,35,49,0.05)';
/** Column names are chips in this product, tinted whether or not they're selected. */
const COL_CHIP = 'rgba(6,191,127,0.10)';
const COL_CHIP_ON = 'rgba(6,191,127,0.18)';

export interface EditAnswerChart {
  /** Bar: categories + one series. Table: columns + rows. Mirrors SampleQuestion.chart. */
  kind: 'bar' | 'table';
  categories?: string[];
  series?: { name: string; data: number[] }[];
  unit?: string;
  columns?: string[];
  rows?: string[][];
}

export interface EditAnswerModalProps {
  /** The question being edited — reads as "editing this answer". */
  title: string;
  /** Model the answer runs against, shown in the dataset dropdown. */
  dataset: string;
  /** The search tokens that produced this answer. */
  tokens: string[];
  measures: string[];
  attributes: string[];
  /** Columns ticked in the picker on open — the ones this answer actually used. */
  initialChecked?: string[];
  chart: EditAnswerChart;
  /**
   * Applied-filter chip under the title. Omit and the editor derives them from any
   * token carrying an operator, which is where filters actually come from.
   */
  filter?: { label: string; value: string };
  onClose: () => void;
}

/** Splits `90-day usage change < 0` into its column and its condition. */
const splitFilterToken = (t: string): { label: string; value: string } | null => {
  const m = t.match(/^(.*?)\s*(!=|>=|<=|=|<|>|\bcontains\b)\s*(.*)$/i);
  if (!m) return null;
  return { label: m[1].trim(), value: `${m[2]} ${m[3]}`.trim() };
};

const EditAnswerModal: React.FC<EditAnswerModalProps> = ({
  title, dataset, tokens, measures, attributes, initialChecked = [], chart: chartData, filter, onClose,
}) => {
  const [checkedCols, setCheckedCols] = React.useState<Set<string>>(new Set(initialChecked));
  // Default to whichever form the answer already has, so opening the editor doesn't
  // silently re-render the thing she was just looking at as a different chart.
  const [chart, setChart] = React.useState(chartData.kind !== 'table');
  const [panelOpen, setPanelOpen] = React.useState(true);
  const toggleCol = (col: string) =>
    setCheckedCols(prev => { const n = new Set(prev); n.has(col) ? n.delete(col) : n.add(col); return n; });

  const cats = chartData.categories ?? [];
  const values = chartData.series?.[0]?.data ?? [];
  const unit = chartData.unit ?? '';
  const chartOption = {
    grid: { left: 56, right: 20, top: 20, bottom: 40 },
    xAxis: { type: 'category', data: cats, axisLine: { lineStyle: { color: c['content-tertiary'] } }, axisTick: { show: false }, axisLabel: { color: '#64748B', fontSize: 12 } },
    yAxis: { type: 'value', axisLabel: { color: '#8B96A5', fontSize: 12, formatter: (v: number) => `${v}${unit}` }, splitLine: { lineStyle: { color: c['content-tertiary'] } } },
    // Negative values are the point of the usage-decline answer, so bars below the
    // axis keep their own colour rather than reading as smaller positives.
    series: [{
      type: 'bar',
      data: values.map(v => ({ value: v, itemStyle: { color: v < 0 ? '#E2705F' : '#3B7BF6' } })),
      barWidth: '58%',
    }],
    tooltip: { trigger: 'axis' as const },
  };

  const railIcon = (path: React.ReactNode, active?: boolean) => (
    <div style={{ width: 32, height: 32, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: active ? '#2770EF' : '#8B96A5', background: active ? 'rgba(39,112,239,0.10)' : 'transparent', cursor: 'pointer' }}>
      <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{path}</svg>
    </div>
  );
  /** History control — undo / redo / reset, grouped in their own bordered cluster. */
  const histIcon = (path: React.ReactNode, label: string) => (
    <button key={label} title={label} aria-label={label} style={{ width: 32, height: 30, border: 'none', background: 'transparent', borderRadius: 6, cursor: 'pointer', color: '#8B96A5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = c['background-subtle']; (e.currentTarget as HTMLElement).style.color = c['content-primary']; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#8B96A5'; }}>
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{path}</svg>
    </button>
  );

  const known = new Set([...measures, ...attributes]);
  const token = (label: string) => {
    // A column reads as a chip; an operator or keyword reads as plain text on a rule.
    // Flattening both into one pill made "top 10" look like a field.
    const isCol = known.has(label);
    return (
      <span key={label} style={{
        fontSize: fs.sm, fontWeight: fw.medium,
        color: c['content-primary'],
        background: isCol ? '#E8EFFB' : '#fff',
        border: `1px solid ${isCol ? '#D3E1F8' : c['border-divider']}`,
        borderRadius: 6, padding: '3px 9px', whiteSpace: 'nowrap' as const,
      }}>{label}</span>
    );
  };
  const checkRow = (col: string) => {
    const on = checkedCols.has(col);
    return (
      <button key={col} onClick={() => toggleCol(col)} style={{ display: 'flex', alignItems: 'center', gap: sp.C, width: '100%', padding: '5px 12px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: ff.primary }}
        onMouseEnter={e => (e.currentTarget.style.background = c['background-subtle'])}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
        <span style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: `1.5px solid ${on ? '#2770EF' : c['border-default']}`, background: on ? '#2770EF' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {on && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2.5 6l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </span>
        {/* Regular weight. Every row in this list is a chip on a tint, and medium on top
            of that made a long column list read as a wall of emphasis with nothing
            standing out — the tick is what marks a selected column, not the weight. */}
        <span style={{ fontSize: fs.sm, fontWeight: fw.regular, color: c['content-primary'], background: on ? COL_CHIP_ON : COL_CHIP, borderRadius: 5, padding: '2px 7px' }}>{col}</span>
      </button>
    );
  };

  // The answer as a table — either the question's own rows, or the bar data laid out
  // as category/value so the toggle works for both shapes.
  const tableCols = chartData.columns ?? ['Category', chartData.series?.[0]?.name ?? 'Value'];
  const tableRows = chartData.rows ?? cats.map((cat, i) => [cat, `${values[i] ?? ''}${unit}`]);

  // Applied filters. Explicit prop wins; otherwise any token with an operator in it is
  // a filter, which is exactly what the product surfaces above the answer.
  const filterChips = filter
    ? [filter]
    : tokens.map(splitFilterToken).filter(Boolean) as { label: string; value: string }[];

  const pillBtn: React.CSSProperties = {
    height: 34, borderRadius: 999, fontSize: fs.sm, fontWeight: fw.semibold,
    cursor: 'pointer', fontFamily: ff.primary, flexShrink: 0,
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(25,35,49,0.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 24px' }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 1280, height: 'calc(100vh - 80px)', background: '#fff', borderRadius: 12, boxShadow: '0 24px 64px rgba(25,35,49,0.28)', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: ff.primary }}>
        {/* Header — divided from the toolbar below it. The title is the modal's, the
            toolbar belongs to the answer; without a rule they read as one tall band. */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '18px 24px', flexShrink: 0, borderBottom: `1px solid ${c['border-divider']}` }}>
          <span style={{ fontSize: 19, fontWeight: fw.semibold, color: c['content-primary'], letterSpacing: '-0.2px' }}>Edit Answer</span>
        </div>
        {/* Search / token toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: sp.C, padding: '12px 24px', flexShrink: 0, background: '#fff' }}>
          {/* One input bar, model and tokens together. They're a single query — "in this
              model, ask this" — and two separately bordered boxes claimed they were
              independent controls. Lifted on a shadow rather than outlined: a border on
              white reads as a container, elevation reads as somewhere you type. */}
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', minWidth: 0, height: 42,
            background: '#fff', borderRadius: 10,
            boxShadow: '0 1px 3px rgba(25,35,49,0.10), 0 3px 10px rgba(25,35,49,0.06)',
          }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: sp.B, height: '100%', padding: '0 14px 0 10px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: ff.primary, flexShrink: 0 }}>
              {/* The dataset mark is a tinted tile in the product — it's the one place the
                  toolbar names an object rather than an action. */}
              <span style={{ width: 26, height: 26, borderRadius: 999, background: 'rgba(39,112,239,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#2770EF" strokeWidth="1.5" strokeLinecap="round"><path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h7"/></svg>
              </span>
              <span style={{ fontSize: fs.md, fontWeight: fw.medium, color: c['content-secondary'] }}>{dataset}</span>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="#8B96A5" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            {/* Scope | query. Inset from the ends so it reads as a seam inside one
                control rather than as the edge of two. */}
            <span style={{ width: 1, alignSelf: 'stretch', margin: '7px 0', background: c['border-divider'], flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: sp.B, minWidth: 0, padding: '0 12px' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}><circle cx="7" cy="7" r="5" stroke="#8B96A5" strokeWidth="1.5"/><path d="M11 11l3 3" stroke="#8B96A5" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <div style={{ display: 'flex', gap: sp.B, alignItems: 'center', overflow: 'hidden' }}>{tokens.map(token)}</div>
            </div>
          </div>
          <button title="Clear" style={{ width: 32, height: 32, border: 'none', background: 'transparent', borderRadius: 6, cursor: 'pointer', color: '#8B96A5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
          <button style={{ ...pillBtn, padding: '0 22px', border: 'none', background: c['background-subtle'], color: c['content-primary'] }}>Go</button>
          {/* Grouped, not loose: undo/redo/reset are one control set and belong in their
              own container rather than trailing the Go button as three stray glyphs. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: sp.A, border: `1px solid ${CARD_BORDER}`, borderRadius: 10, padding: sp.A, flexShrink: 0, background: '#fff' }}>
            {histIcon(<><path d="M7.5 5.5L4 9l3.5 3.5" /><path d="M4 9h7a4.5 4.5 0 0 1 0 9H8" /></>, 'Undo')}
            {histIcon(<><path d="M12.5 5.5L16 9l-3.5 3.5" /><path d="M16 9H9a4.5 4.5 0 0 0 0 9h3" /></>, 'Redo')}
            {histIcon(<><path d="M16 10a6 6 0 1 1-1.9-4.4" /><path d="M16.2 4v3.2H13" /></>, 'Reset')}
          </div>
        </div>
        {/* Body — sunken, with the three regions as cards */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0, background: SUNKEN, padding: sp.C, gap: sp.C }}>
          {/* Column picker */}
          {panelOpen && (
          <aside style={{ width: 250, flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: 0, background: '#fff', border: `1px solid ${CARD_BORDER}`, borderRadius: 10, boxShadow: CARD_SHADOW, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: sp.C, padding: '10px 12px 8px' }}>
              <span style={{ fontSize: fs.sm, color: c['content-tertiary'], fontWeight: fw.medium, cursor: 'pointer' }}>Popular</span>
              <span style={{ fontSize: fs.sm, color: '#2770EF', fontWeight: fw.semibold, borderBottom: '2px solid #2770EF', paddingBottom: sp.A, cursor: 'pointer' }}>All</span>
              {/* Collapse the picker — the product puts this at the end of the tab row. */}
              <button onClick={() => setPanelOpen(false)} title="Hide columns" style={{ marginLeft: 'auto', width: 24, height: 24, border: 'none', background: 'transparent', borderRadius: 5, cursor: 'pointer', color: '#8B96A5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.4"/><rect x="2.8" y="3.8" width="4.4" height="10.4" rx="1.2" fill="currentColor"/></svg>
              </button>
            </div>
            <div style={{ padding: '2px 12px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, height: 34, border: `1px solid ${CARD_BORDER}`, borderRadius: 8, padding: '0 10px' }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="#A5ACB9" strokeWidth="1.5"/><path d="M11 11l3 3" stroke="#A5ACB9" strokeWidth="1.5" strokeLinecap="round"/></svg>
                <span style={{ fontSize: fs.sm, color: c['content-tertiary'] }}>Find columns</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: sp.A, marginTop: sp.B, color: '#2770EF', fontSize: fs.sm, fontWeight: fw.semibold, cursor: 'pointer' }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>Add
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: sp.C, borderTop: `1px solid ${c['border-divider']}` }}>
              <div style={{ padding: '10px 12px 4px', fontSize: fs.sm, fontWeight: fw.regular, color: c['content-secondary'], display: 'flex', alignItems: 'center', gap: sp.B }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="#8B96A5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>Measures
              </div>
              {measures.map(checkRow)}
              <div style={{ padding: '12px 12px 4px', fontSize: fs.sm, fontWeight: fw.regular, color: c['content-secondary'], display: 'flex', alignItems: 'center', gap: sp.B }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="#8B96A5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>Attributes
              </div>
              {attributes.map(checkRow)}
            </div>
          </aside>
          )}
          {/* Answer + viz rail — one card, divided. The rail is part of the answer
              surface, not a third panel: floating it separately put a gap of page
              between a control and the thing it controls. */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', background: '#fff', border: `1px solid ${CARD_BORDER}`, borderRadius: 10, boxShadow: CARD_SHADOW, overflow: 'hidden' }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', padding: '18px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: sp.D }}>
              <div style={{ minWidth: 0, display: 'flex', alignItems: 'flex-start', gap: sp.C }}>
                {!panelOpen && (
                  <button onClick={() => setPanelOpen(true)} title="Show columns" style={{ width: 26, height: 26, border: `1px solid ${CARD_BORDER}`, background: '#fff', borderRadius: 6, cursor: 'pointer', color: '#8B96A5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="15" height="15" viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M7 3v12" stroke="currentColor" strokeWidth="1.4"/></svg>
                  </button>
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 19, fontWeight: fw.semibold, color: c['content-primary'], letterSpacing: '-0.2px' }}>{title}</div>
                  <div style={{ fontSize: fs.md, color: c['content-tertiary'], marginTop: sp.A }}>Add description</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, flexShrink: 0 }}>
                <div style={{ display: 'flex', background: c['background-subtle'], borderRadius: 8, padding: sp.A, gap: sp.A }}>
                  <button onClick={() => setChart(false)} style={{ width: 32, height: 27, border: 'none', borderRadius: 6, cursor: 'pointer', background: !chart ? '#fff' : 'transparent', boxShadow: !chart ? '0 1px 2px rgba(25,35,49,0.12)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: !chart ? c['content-primary'] : '#8B96A5' }}>
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="2" y="2.5" width="12" height="11" rx="1"/><path d="M2 6h12M6 6v7.5"/></svg>
                  </button>
                  <button onClick={() => setChart(true)} style={{ width: 32, height: 27, border: 'none', borderRadius: 6, cursor: 'pointer', background: chart ? '#fff' : 'transparent', boxShadow: chart ? '0 1px 2px rgba(25,35,49,0.12)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: chart ? '#2770EF' : '#8B96A5' }}>
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M3 13V8M7 13V4M11 13V6M15 13H1"/></svg>
                  </button>
                </div>
                <button style={{ width: 30, height: 30, border: 'none', background: 'transparent', borderRadius: 6, cursor: 'pointer', color: '#8B96A5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="3" cy="8" r="1.4"/><circle cx="8" cy="8" r="1.4"/><circle cx="13" cy="8" r="1.4"/></svg>
                </button>
              </div>
            </div>
            {filterChips.length > 0 && (
              <div style={{ marginTop: sp.C, display: 'flex', flexWrap: 'wrap', gap: sp.B }}>
                {filterChips.map(f => (
                  <span key={f.label + f.value} style={{ display: 'inline-flex', alignItems: 'center', gap: sp.B, fontSize: fs.sm, background: c['background-subtle'], borderRadius: 20, padding: '6px 14px', color: c['content-secondary'] }}>
                    <span style={{ color: c['content-secondary'] }}>{f.label}</span>
                    <span style={{ fontWeight: fw.semibold, color: c['content-primary'] }}>{f.value}</span>
                  </span>
                ))}
              </div>
            )}
            <div style={{ flex: 1, minHeight: 0, marginTop: sp.D }}>
              {chart
                ? <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} />
                : (
                  <div style={{ height: '100%', overflow: 'auto', border: `1px solid ${c['border-divider']}`, borderRadius: 8 }}>
                    <div style={{ display: 'flex', padding: '8px 14px', borderBottom: `1px solid ${c['border-divider']}`, background: SUNKEN }}>
                      {tableCols.map(col => (
                        <span key={col} style={{ flex: 1, fontSize: fs.xs, fontWeight: fw.semibold, color: c['content-secondary'], textTransform: 'uppercase', letterSpacing: '0.02em' }}>{col}</span>
                      ))}
                    </div>
                    {tableRows.map((row, i) => (
                      <div key={i} style={{ display: 'flex', padding: '8px 14px', borderBottom: `1px solid ${c['border-divider']}`, background: i % 2 ? c['background-sunken'] : '#fff' }}>
                        {row.map((cell, j) => (
                          <span key={j} style={{ flex: 1, fontSize: fs.sm, color: c['content-primary'], fontWeight: j === row.length - 1 ? fw.semibold : fw.regular }}>{cell}</span>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
          {/* Viz-type rail — inside the answer card, on its own tinted ground so the
              column of controls separates from the answer without a second card. */}
          <div style={{ width: 48, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0', gap: sp.A, background: c['background-base'], borderLeft: `1px solid ${c['border-divider']}` }}>
            {railIcon(<path d="M3 15V9M7.5 15V4M12 15V7M16.5 15v-4" />, true)}
            {railIcon(<><rect x="3" y="4" width="6" height="5" rx="1" /><rect x="11" y="4" width="6" height="5" rx="1" /><rect x="3" y="11" width="14" height="5" rx="1" /></>)}
            {railIcon(<><path d="M4 16V6" /><path d="M10 16V4" /><path d="M16 16V9" /></>)}
            {railIcon(<><path d="M4 5v6a3 3 0 0 0 3 3h8" /><path d="M13 11.5l3 2.5-3 2.5" /></>)}
            {railIcon(<><path d="M3 6h3M4.5 6v5" /><path d="M9 6h3v2.5H9V11h3" /><path d="M15 6h2.5v5H15" /></>)}
            {railIcon(<><rect x="3" y="4" width="14" height="10" rx="1.5" /><path d="M7 17h6" /></>)}
            {railIcon(<><circle cx="5" cy="6" r="1.4" /><path d="M9 6h8" /><circle cx="5" cy="11" r="1.4" /><path d="M9 11h8" /><circle cx="5" cy="16" r="1.4" /><path d="M9 16h5" /></>)}
            {railIcon(<><circle cx="10" cy="10" r="6" /><circle cx="10" cy="10" r="2" /></>)}
            {railIcon(<><path d="M7 6.5L3.5 10 7 13.5" /><path d="M13 6.5L16.5 10 13 13.5" /></>)}
            {railIcon(<path d="M11 3l-6 8h5l-1 6 6-8h-5z" />)}
          </div>
          </div>
        </div>
        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: sp.C, padding: '14px 24px', background: SUNKEN, borderTop: `1px solid ${c['border-divider']}`, flexShrink: 0 }}>
          <button onClick={onClose} style={{ ...pillBtn, height: 40, padding: '0 22px', border: `1px solid ${CARD_BORDER}`, background: '#fff', color: c['content-primary'] }}>Discard changes</button>
          <button onClick={onClose} style={{ ...pillBtn, height: 40, padding: '0 24px', border: 'none', background: '#2770EF', color: '#fff' }}>Done editing</button>
        </div>
      </div>
    </div>
  );
};

export default EditAnswerModal;
