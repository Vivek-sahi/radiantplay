import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { c, ff, fw } from '../styles';
import type { DataFrame } from '../types';
import { resolveSpotter, sampleQuestions, type SpotterAnswer } from '../spotter';
import { CloseIcon } from './ui';

interface SpotterPanelProps {
  open: boolean;
  onClose: () => void;
  modelName: string;
  records: DataFrame;
  columns: string[];
}

interface Turn { q: string; a: SpotterAnswer }

const AnswerCard: React.FC<{ turn: Turn; modelName: string }> = ({ turn, modelName }) => {
  const { a } = turn;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <div style={{ background: '#eef4ff', color: c['content-primary'], borderRadius: '14px 14px 4px 14px', padding: '8px 13px', fontSize: 13.5, maxWidth: '80%' }}>{turn.q}</div>
      </div>
      <div style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, overflow: 'hidden', background: c['background-base'] }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <Spark />
          <span style={{ fontSize: 13, fontWeight: fw.semibold, color: c['content-primary'] }}>{a.interpretation}</span>
        </div>

        {a.headline && (
          <div style={{ padding: '18px 16px' }}>
            <div style={{ fontSize: 38, fontWeight: fw.semibold, color: c['content-primary'], letterSpacing: '-0.5px', lineHeight: 1 }}>{a.headline.value}</div>
            <div style={{ fontSize: 12.5, color: c['content-secondary'], marginTop: 6 }}>{a.headline.label}</div>
          </div>
        )}

        {a.chart && (
          <div style={{ padding: '10px 8px 4px' }}>
            <ReactECharts
              option={{
                grid: { left: 48, right: 16, top: 16, bottom: 44 },
                tooltip: { trigger: 'axis' },
                xAxis: { type: 'category', data: a.chart.categories, axisLabel: { fontSize: 10, color: '#8a93a3', rotate: a.chart.categories.length > 6 ? 30 : 0 }, axisLine: { lineStyle: { color: '#e3e7ee' } } },
                yAxis: { type: 'value', axisLabel: { fontSize: 10, color: '#8a93a3', formatter: a.chart.format === 'percent' ? (v: number) => `${Math.round(v * 100)}%` : a.chart.format === 'currency' ? (v: number) => `$${Math.round(v / 1000)}k` : '{value}' }, splitLine: { lineStyle: { color: '#f0f2f6' } } },
                series: [{ type: 'bar', data: a.chart.values, itemStyle: { color: '#2770EF', borderRadius: [3, 3, 0, 0] }, barMaxWidth: 40 }],
              }}
              style={{ height: 220 }}
              notMerge
            />
          </div>
        )}

        {a.table && (
          <div style={{ overflow: 'auto', maxHeight: 280 }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead><tr>{a.table.columns.map(co => <th key={co} style={{ position: 'sticky', top: 0, background: '#fbfcfd', textAlign: 'left', padding: '6px 12px', fontSize: 11.5, fontWeight: fw.semibold, color: c['content-secondary'], borderBottom: '1px solid rgba(0,0,0,0.08)', whiteSpace: 'nowrap' }}>{co}</th>)}</tr></thead>
              <tbody>
                {a.table.rows.map((r, i) => (
                  <tr key={i} style={{ background: i % 2 ? 'rgba(0,0,0,0.014)' : 'transparent' }}>
                    {a.table!.columns.map(co => <td key={co} style={{ padding: '5px 12px', fontSize: 12, color: r[co] == null ? '#c4c9d4' : c['content-primary'], whiteSpace: 'nowrap' }}>{r[co] == null ? 'null' : String(r[co])}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* lineage / trust line */}
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', background: 'rgba(0,0,0,0.015)', padding: '8px 13px' }}>
          <div style={{ fontSize: 11, color: '#8a93a3', marginBottom: 4 }}>Answered from <b style={{ color: c['content-secondary'] }}>{modelName}</b> — built in your notebook:</div>
          <pre style={{ margin: 0, fontSize: 11, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', color: '#5b6472', whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>{a.sql}</pre>
        </div>
      </div>
    </div>
  );
};

const SpotterPanel: React.FC<SpotterPanelProps> = ({ open, onClose, modelName, records, columns }) => {
  const [q, setQ] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  if (!open) return null;
  const samples = sampleQuestions(columns);

  const ask = (text: string) => {
    const t = text.trim(); if (!t) return;
    setTurns(prev => [...prev, { q: t, a: resolveSpotter(t, modelName, records, columns) }]);
    setQ('');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 110, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: ff.primary }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: 640, maxWidth: '94vw', height: 680, maxHeight: '90vh', background: c['background-base'], borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
        {/* header */}
        <div style={{ flexShrink: 0, padding: '14px 16px', borderBottom: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg, #2770EF, #6E56CF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spark light /></div>
          <div>
            <div style={{ fontSize: 14, fontWeight: fw.semibold, color: c['content-primary'] }}>Ask Spotter</div>
            <div style={{ fontSize: 11.5, color: c['content-secondary'] }}>Published model · <span style={{ fontFamily: 'ui-monospace, monospace' }}>{modelName}</span></div>
          </div>
          <span style={{ marginLeft: 8, fontSize: 10.5, fontWeight: fw.semibold, color: '#15803d', background: 'rgba(22,163,74,0.1)', padding: '2px 8px', borderRadius: 20 }}>● Published</span>
          <button onClick={onClose} style={{ marginLeft: 'auto', width: 30, height: 30, borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', color: c['content-secondary'], display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CloseIcon size={15} /></button>
        </div>

        {/* feed */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {turns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 16px', color: c['content-secondary'] }}>
              <div style={{ fontSize: 14, fontWeight: fw.medium, color: c['content-primary'] }}>Your model is live in ThoughtSpot.</div>
              <div style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>Ask it anything in plain English — every answer is computed from the model you just built, and shows the query behind it.</div>
            </div>
          ) : turns.map((t, i) => <AnswerCard key={i} turn={t} modelName={modelName} />)}
        </div>

        {/* composer + samples */}
        <div style={{ flexShrink: 0, borderTop: '1px solid rgba(0,0,0,0.08)', padding: 12 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {samples.map(s => (
              <button key={s} onClick={() => ask(s)} style={{ fontSize: 11.5, color: c['content-secondary'], background: 'rgba(0,0,0,0.04)', border: 'none', borderRadius: 20, padding: '4px 11px', cursor: 'pointer', fontFamily: ff.primary }}>{s}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, border: `1px solid ${c['border-default']}`, borderRadius: 11, padding: '6px 6px 6px 12px', alignItems: 'center' }}>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') ask(q); }}
              placeholder="Ask about your model… e.g. “average health by region”"
              style={{ flex: 1, border: 'none', outline: 'none', fontFamily: ff.primary, fontSize: 13.5, color: c['content-primary'], background: 'transparent' }}
            />
            <button onClick={() => ask(q)} disabled={!q.trim()} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: q.trim() ? c['content-brand'] : 'rgba(0,0,0,0.08)', color: q.trim() ? '#fff' : '#aeb6c2', cursor: q.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 13V3M8 3L4 7M8 3L12 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Spark: React.FC<{ light?: boolean }> = ({ light }) => (
  <svg width={light ? 16 : 15} height={light ? 16 : 15} viewBox="0 0 16 16" fill="none"><path d="M8 1.5C8.4 4.8 11.2 7.6 14.5 8C11.2 8.4 8.4 11.2 8 14.5C7.6 11.2 4.8 8.4 1.5 8C4.8 7.6 7.6 4.8 8 1.5Z" fill={light ? '#fff' : '#2770EF'}/></svg>
);

export default SpotterPanel;
