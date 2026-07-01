import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { c, ff, fw } from '../styles';
import type { Cell as CellT, DataFrame, SqlSourceId } from '../types';

type NarrowAgg = 'sum' | 'avg' | 'count' | 'min' | 'max';
import CodeEditor from './CodeEditor';
import ResultsView from './ResultsView';
import { aggregateForChart, aggValue, type Agg } from '../agg';
import { cellTypeMeta, CellGlyph, StatusDot, Pill, IconButton, PlayIcon, DotsIcon, DragHandle } from './ui';

export interface VarInfo { records: DataFrame; columns: string[] }

interface CellProps {
  cell: CellT;
  varNames: string[];                                  // dataframe vars available
  resolveVar: (name: string) => VarInfo | undefined;
  onChange: (patch: Partial<CellT>) => void;
  onRun: () => void;
  onDelete: () => void;
  onLoadCsv?: (fileName: string, text: string) => void;
  isFirst: boolean;
  isLast: boolean;
}

const SOURCE_LABEL: Record<SqlSourceId, string> = {
  sf_prod_customer: 'SF_PROD_CUSTOMER',
  spotstore: 'ThoughtSpot CDW',
  dataframes: 'Dataframes',
};

// ── small styled select ─────────────────────────────────────────────────────────
const Select: React.FC<{ value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; width?: number | string }> = ({ value, onChange, options, width }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    style={{
      fontFamily: ff.primary, fontSize: 11.5, fontWeight: fw.medium,
      color: c['content-primary'], border: `1px solid ${c['border-default']}`,
      borderRadius: 6, padding: '3px 6px', background: c['background-base'],
      cursor: 'pointer', maxWidth: width ?? 'auto', outline: 'none',
    }}
  >
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ fontSize: 10.5, fontWeight: fw.semibold, color: '#aeb6c2', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{children}</span>
);

// ── lightweight markdown render ─────────────────────────────────────────────────
const renderMarkdown = (md: string, interp: (s: string) => string): React.ReactNode => {
  const text = interp(md);
  const lines = text.split('\n');
  const out: React.ReactNode[] = [];
  let list: string[] = [];
  const flushList = (key: number) => {
    if (list.length) {
      out.push(<ul key={`ul${key}`} style={{ margin: '4px 0 8px', paddingLeft: 20 }}>{list.map((li, i) => <li key={i} style={{ fontSize: 13, color: c['content-primary'], lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: inline(li) }} />)}</ul>);
      list = [];
    }
  };
  const inline = (s: string) => s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<code style="background:rgba(0,0,0,0.06);padding:1px 4px;border-radius:3px;font-size:12px">$1</code>');
  lines.forEach((ln, i) => {
    if (/^###\s/.test(ln)) { flushList(i); out.push(<h4 key={i} style={{ margin: '10px 0 4px', fontSize: 13, fontWeight: fw.semibold, color: c['content-primary'] }}>{ln.replace(/^###\s/, '')}</h4>); }
    else if (/^##\s/.test(ln)) { flushList(i); out.push(<h3 key={i} style={{ margin: '12px 0 5px', fontSize: 15, fontWeight: fw.semibold, color: c['content-primary'] }}>{ln.replace(/^##\s/, '')}</h3>); }
    else if (/^#\s/.test(ln)) { flushList(i); out.push(<h2 key={i} style={{ margin: '12px 0 6px', fontSize: 18, fontWeight: fw.semibold, color: c['content-primary'] }}>{ln.replace(/^#\s/, '')}</h2>); }
    else if (/^[-*]\s/.test(ln)) { list.push(ln.replace(/^[-*]\s/, '')); }
    else if (ln.trim() === '') { flushList(i); }
    else { flushList(i); out.push(<p key={i} style={{ margin: '4px 0', fontSize: 13, color: c['content-primary'], lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: inline(ln) }} />); }
  });
  flushList(9999);
  return out;
};

const fmtVal = (n: number, format: string): string => {
  if (!Number.isFinite(n)) return '—';
  if (format === 'percent') return `${(n * 100).toFixed(0)}%`;
  if (format === 'currency') return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;
  return Number.isInteger(n) ? n.toLocaleString() : n.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

// ─────────────────────────────────────────────────────────────────────────────
const Cell: React.FC<CellProps> = ({ cell, varNames, resolveVar, onChange, onRun, onDelete, onLoadCsv }) => {
  const [hover, setHover] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mdEditing, setMdEditing] = useState(cell.type === 'markdown' && !cell.markdown);
  const meta = cellTypeMeta[cell.type];
  const accent = meta.color;
  const isExec = cell.type === 'sql' || cell.type === 'python' || cell.type === 'pivot' || cell.type === 'single-value';

  const varOptions = varNames.map(v => ({ value: v, label: v }));
  const columnsOf = (v: string) => resolveVar(v)?.columns ?? [];

  // ── header ──
  const header = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px 7px 8px', minHeight: 38 }}>
      <span style={{ width: 12, color: '#c4c9d4', opacity: hover ? 1 : 0, transition: 'opacity 0.12s', cursor: 'grab' }}><DragHandle /></span>
      <CellGlyph type={cell.type} />
      <input
        value={cell.name}
        onChange={e => onChange({ name: e.target.value.replace(/[^A-Za-z0-9_]/g, '_') })}
        spellCheck={false}
        style={{
          border: 'none', outline: 'none', background: 'transparent',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12.5, fontWeight: fw.semibold,
          color: c['content-primary'], width: Math.max(80, cell.name.length * 8 + 10), padding: '2px 4px', borderRadius: 4,
        }}
      />

      {/* type-specific header controls */}
      {cell.type === 'sql' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Select value={cell.source} onChange={v => onChange({ source: v as SqlSourceId })} options={(['sf_prod_customer', 'spotstore', 'dataframes'] as SqlSourceId[]).map(s => ({ value: s, label: SOURCE_LABEL[s] }))} />
          <Pill
            color={cell.returnMode === 'dataframe' ? '#15803d' : '#7c3aed'}
            bg={cell.returnMode === 'dataframe' ? 'rgba(22,163,74,0.1)' : 'rgba(124,58,237,0.1)'}
            onClick={() => onChange({ returnMode: cell.returnMode === 'dataframe' ? 'query' : 'dataframe' })}
            title="Toggle return type"
          >
            {cell.returnMode === 'dataframe' ? 'Dataframe' : 'Query'}
          </Pill>
        </div>
      )}

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
        {isExec && cell.status === 'stale' && <span style={{ fontSize: 10.5, fontWeight: fw.semibold, color: '#b45309' }}>stale</span>}
        <StatusDot status={cell.status} />
        {isExec && (
          <IconButton onClick={onRun} title="Run cell  (⌘↵)">
            <PlayIcon />
          </IconButton>
        )}
        <div style={{ position: 'relative' }}>
          <IconButton onClick={() => setMenuOpen(o => !o)} title="More"><DotsIcon /></IconButton>
          {menuOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 30 }} onClick={() => setMenuOpen(false)} />
              <div style={{ position: 'absolute', top: 28, right: 0, zIndex: 31, background: c['background-base'], borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.06)', padding: 4, minWidth: 140 }}>
                {cell.type === 'markdown' && (
                  <button onClick={() => { setMdEditing(e => !e); setMenuOpen(false); }} style={menuItem}>{mdEditing ? 'Preview' : 'Edit'}</button>
                )}
                <button onClick={() => { onDelete(); setMenuOpen(false); }} style={{ ...menuItem, color: '#dc2626' }}>Delete cell</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // ── body ──
  let body: React.ReactNode = null;
  let output: React.ReactNode = null;

  if (cell.type === 'sql' || cell.type === 'python') {
    body = (
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', padding: '0 6px' }}>
        <CodeEditor value={cell.code} language={cell.type === 'sql' ? 'sql' : 'python'} onChange={code => onChange({ code })} onRun={onRun} />
      </div>
    );
    if (cell.output) output = <ResultsView output={cell.output} />;
  }

  if (cell.type === 'pivot') {
    body = (
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', padding: 10, display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><Label>Source</Label><Select value={cell.sourceVar} onChange={v => onChange({ sourceVar: v })} options={varOptions} /></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><Label>Group by</Label><Select value={cell.groupBy[0] ?? ''} onChange={v => onChange({ groupBy: [v] })} options={columnsOf(cell.sourceVar).map(co => ({ value: co, label: co }))} /></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><Label>Aggregate</Label><Select value={cell.values[0]?.agg ?? 'count'} onChange={v => onChange({ values: [{ ...(cell.values[0] ?? { column: columnsOf(cell.sourceVar)[0] }), agg: v as NarrowAgg }] })} options={['count', 'sum', 'avg', 'min', 'max'].map(a => ({ value: a, label: a }))} /></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><Label>Of column</Label><Select value={cell.values[0]?.column ?? ''} onChange={v => onChange({ values: [{ agg: (cell.values[0]?.agg ?? 'sum') as NarrowAgg, column: v }] })} options={columnsOf(cell.sourceVar).map(co => ({ value: co, label: co }))} /></div>
      </div>
    );
    if (cell.output) output = <ResultsView output={cell.output} />;
  }

  if (cell.type === 'single-value') {
    const info = resolveVar(cell.sourceVar);
    const live = info ? aggValue(info.records, cell.column, cell.agg as Agg) : NaN;
    const display = cell.output?.scalar !== undefined && cell.output?.scalar !== null ? Number(cell.output.scalar) : live;
    body = (
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '18px 16px 6px' }}>
          <div style={{ fontSize: 34, fontWeight: fw.semibold, color: c['content-primary'], lineHeight: 1.1, letterSpacing: '-0.5px' }}>{fmtVal(display, cell.format)}</div>
          {cell.caption && <div style={{ fontSize: 12, color: c['content-secondary'], marginTop: 4 }}>{cell.caption}</div>}
        </div>
        <div style={{ padding: 10, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><Label>Source</Label><Select value={cell.sourceVar} onChange={v => onChange({ sourceVar: v })} options={varOptions} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><Label>Aggregate</Label><Select value={cell.agg} onChange={v => onChange({ agg: v as any })} options={['count', 'sum', 'avg', 'min', 'max'].map(a => ({ value: a, label: a }))} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><Label>Column</Label><Select value={cell.column} onChange={v => onChange({ column: v })} options={columnsOf(cell.sourceVar).map(co => ({ value: co, label: co }))} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><Label>Format</Label><Select value={cell.format} onChange={v => onChange({ format: v as any })} options={['number', 'percent', 'currency'].map(f => ({ value: f, label: f }))} /></div>
        </div>
      </div>
    );
  }

  if (cell.type === 'chart') {
    const info = resolveVar(cell.sourceVar);
    const cols = info?.columns ?? [];
    const data = info ? aggregateForChart(info.records, cell.x, cell.y, cell.agg as Agg, cell.series) : null;
    const isLine = cell.chartType === 'line' || cell.chartType === 'area';
    const option = data ? {
      grid: { left: 50, right: 16, top: 24, bottom: 48 },
      tooltip: { trigger: 'axis' },
      legend: cell.series ? { top: 0, type: 'scroll', textStyle: { fontSize: 11 } } : undefined,
      xAxis: { type: 'category', data: data.categories, axisLabel: { fontSize: 10, color: '#8a93a3', rotate: data.categories.length > 6 ? 30 : 0 }, axisLine: { lineStyle: { color: '#e3e7ee' } } },
      yAxis: { type: 'value', axisLabel: { fontSize: 10, color: '#8a93a3' }, splitLine: { lineStyle: { color: '#f0f2f6' } } },
      series: data.series.map(s => ({
        name: s.name, data: s.data,
        type: cell.chartType === 'scatter' ? 'scatter' : isLine ? 'line' : 'bar',
        smooth: isLine, areaStyle: cell.chartType === 'area' ? { opacity: 0.18 } : undefined,
        itemStyle: { color: accent, borderRadius: cell.chartType === 'bar' ? [3, 3, 0, 0] : 0 },
        barMaxWidth: 38, symbolSize: 7,
      })),
      color: ['#2770EF', '#D97706', '#059669', '#DB2777', '#6E56CF', '#0EA5E9'],
    } : null;
    body = (
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        {option
          ? <div style={{ padding: '8px 6px 0' }}><ReactECharts option={option} style={{ height: 240 }} notMerge lazyUpdate /></div>
          : <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: c['content-secondary'] }}>Pick a source dataframe and columns to chart.</div>}
        <div style={{ padding: 10, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><Label>Source</Label><Select value={cell.sourceVar} onChange={v => onChange({ sourceVar: v })} options={varOptions} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><Label>Type</Label><Select value={cell.chartType} onChange={v => onChange({ chartType: v as any })} options={['bar', 'line', 'area', 'scatter'].map(t => ({ value: t, label: t }))} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><Label>X</Label><Select value={cell.x} onChange={v => onChange({ x: v })} options={cols.map(co => ({ value: co, label: co }))} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><Label>Y</Label><Select value={cell.y} onChange={v => onChange({ y: v })} options={cols.map(co => ({ value: co, label: co }))} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><Label>Aggregate</Label><Select value={cell.agg} onChange={v => onChange({ agg: v as any })} options={['sum', 'avg', 'count', 'min', 'max', 'none'].map(a => ({ value: a, label: a }))} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><Label>Series</Label><Select value={cell.series ?? ''} onChange={v => onChange({ series: v || undefined })} options={[{ value: '', label: 'none' }, ...cols.map(co => ({ value: co, label: co }))]} /></div>
        </div>
      </div>
    );
  }

  if (cell.type === 'input') {
    const setVal = (value: string | number) => onChange({ value });
    let control: React.ReactNode = null;
    if (cell.inputKind === 'dropdown') {
      const opts = cell.optionsFromVar ? (resolveVar(cell.optionsFromVar)?.records ?? []).map(r => String(r[cell.optionsFromColumn ?? ''])).filter((v, i, a) => a.indexOf(v) === i) : (cell.options ?? []);
      control = <Select value={String(cell.value)} onChange={setVal} options={opts.map(o => ({ value: o, label: o }))} />;
    } else if (cell.inputKind === 'slider') {
      control = (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <input type="range" min={cell.min ?? 0} max={cell.max ?? 100} step={cell.step ?? 1} value={Number(cell.value)} onChange={e => setVal(Number(e.target.value))} style={{ flex: 1, accentColor: '#2770EF' }} />
          <span style={{ fontSize: 13, fontWeight: fw.semibold, color: c['content-primary'], fontVariantNumeric: 'tabular-nums', minWidth: 40 }}>{cell.value}</span>
        </div>
      );
    } else if (cell.inputKind === 'date') {
      control = <input type="date" value={String(cell.value)} onChange={e => setVal(e.target.value)} style={inputStyle} />;
    } else {
      control = <input type="text" value={String(cell.value)} onChange={e => setVal(e.target.value)} style={inputStyle} />;
    }
    body = (
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', padding: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12.5, fontWeight: fw.medium, color: c['content-primary'], minWidth: 90 }}>{cell.label}</span>
          {control}
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: '#aeb6c2', fontFamily: 'ui-monospace, monospace' }}>→ {`{{${cell.name}}}`} = {JSON.stringify(cell.value)}</div>
      </div>
    );
  }

  if (cell.type === 'markdown') {
    const interp = (s: string) => s.replace(/\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g, (_m, name) => {
      const v = resolveVar(name);
      return v ? `\`${name}\`` : `{{${name}}}`;
    });
    body = mdEditing ? (
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', padding: 8 }}>
        <textarea
          value={cell.markdown}
          onChange={e => onChange({ markdown: e.target.value })}
          onBlur={() => cell.markdown && setMdEditing(false)}
          autoFocus
          placeholder="Write markdown… use {{variable}} to interpolate"
          style={{ width: '100%', minHeight: 80, border: 'none', outline: 'none', resize: 'vertical', fontFamily: 'ui-monospace, monospace', fontSize: 12.5, color: c['content-primary'], lineHeight: 1.6 }}
        />
      </div>
    ) : (
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', padding: '10px 16px', cursor: 'text' }} onClick={() => setMdEditing(true)}>
        {renderMarkdown(cell.markdown || '_Empty text cell — click to edit_', interp)}
      </div>
    );
  }

  if (cell.type === 'csv') {
    const readFile = (file: File) => {
      const reader = new FileReader();
      reader.onload = () => onLoadCsv?.(file.name, String(reader.result ?? ''));
      reader.readAsText(file);
    };
    body = (
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        {!cell.loaded ? (
          <label
            onDragOver={e => { e.preventDefault(); }}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) readFile(f); }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '26px 16px', margin: 10, border: `1.5px dashed ${c['border-default']}`, borderRadius: 10, cursor: 'pointer', background: 'rgba(13,148,136,0.03)' }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 16V4M12 4L8 8M12 4L16 8" stroke="#0D9488" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 16V19A1 1 0 0 0 5 20H19A1 1 0 0 0 20 19V16" stroke="#0D9488" strokeWidth="1.6" strokeLinecap="round"/></svg>
            <div style={{ fontSize: 13, fontWeight: fw.medium, color: c['content-primary'] }}>Drop a CSV here, or click to browse</div>
            <button onClick={e => { e.preventDefault(); onLoadCsv?.('CSM_MAPPING_Q2.csv', '__sample__'); }} style={{ fontSize: 11.5, color: '#0D9488', background: 'none', border: 'none', cursor: 'pointer', fontFamily: ff.primary, fontWeight: fw.semibold }}>Use sample — CSM_MAPPING_Q2.csv</button>
            <input type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) readFile(f); }} />
          </label>
        ) : (
          <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: cell.output ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
            <CellGlyph type="csv" size={13} />
            <span style={{ fontSize: 12.5, fontWeight: fw.medium, color: c['content-primary'] }}>{cell.fileName ?? 'data.csv'}</span>
            <label style={{ marginLeft: 'auto', fontSize: 11.5, color: '#0D9488', cursor: 'pointer', fontWeight: fw.semibold }}>
              Replace
              <input type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) readFile(f); }} />
            </label>
          </div>
        )}
      </div>
    );
    if (cell.output) output = <ResultsView output={cell.output} />;
  }

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        background: c['background-base'],
        borderRadius: 10,
        border: `1px solid ${cell.status === 'error' ? '#fecaca' : hover ? 'rgba(39,112,239,0.25)' : 'rgba(0,0,0,0.08)'}`,
        boxShadow: hover ? '0 2px 10px rgba(0,0,0,0.05)' : '0 1px 2px rgba(0,0,0,0.03)',
        transition: 'box-shadow 0.12s, border-color 0.12s',
        overflow: 'hidden',
        animation: cell.appearing ? 'hexfadein 0.35s ease' : undefined,
      }}
    >
      {/* accent rail */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: accent, opacity: 0.85 }} />
      {header}
      {body}
      {output}
    </div>
  );
};

const menuItem: React.CSSProperties = {
  display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px',
  fontSize: 12.5, fontFamily: ff.primary, color: c['content-primary'],
  background: 'transparent', border: 'none', borderRadius: 5, cursor: 'pointer',
};
const inputStyle: React.CSSProperties = {
  fontFamily: ff.primary, fontSize: 12.5, color: c['content-primary'],
  border: `1px solid ${c['border-default']}`, borderRadius: 6, padding: '5px 8px', outline: 'none', flex: 1,
};

export default Cell;
