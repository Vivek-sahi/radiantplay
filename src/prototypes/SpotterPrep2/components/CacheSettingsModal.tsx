import React, { useState } from 'react';
import { c, sp, fs, fw, ff } from '../styles';

interface CacheSettingsModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const CACHE_WINDOWS = ['1 week', '2 weeks', '1 month', '3 months', '6 months', '1 year'];

const DATE_REFS = [
  'employees : hire_date',
  'employees : termination_date',
  'payroll : pay_period',
  'performance_reviews : review_date',
];

const FREQUENCIES = ['Daily', 'Weekly', 'Monthly'];

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

const selectStyle: React.CSSProperties = {
  padding: `${sp.B}px ${sp.C}px`,
  border: `1px solid ${c['border-default']}`,
  borderRadius: 6,
  fontSize: fs.sm,
  color: c['content-primary'],
  backgroundColor: c['background-base'],
  fontFamily: ff.primary,
  cursor: 'pointer',
  outline: 'none',
  appearance: 'auto',
};

const CacheSettingsModal: React.FC<CacheSettingsModalProps> = ({ onConfirm, onCancel }) => {
  const [cacheWindow, setCacheWindow]           = useState('1 month');
  const [dateRef, setDateRef]                   = useState(DATE_REFS[0]);
  const [frequency, setFrequency]               = useState('Daily');
  const [hour, setHour]                         = useState('09');
  const [minute, setMinute]                     = useState('00');
  const [excludeWeekends, setExcludeWeekends]   = useState(true);

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: sp.J,
    padding: `${sp.D}px 0`,
  };

  const labelColStyle: React.CSSProperties = {
    flex: '0 0 46%',
  };

  const controlColStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    justifyContent: 'flex-end',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'rgba(29,35,47,0.5)',
      zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: ff.primary,
    }}>
      <div style={{
        width: 720,
        backgroundColor: c['background-base'],
        borderRadius: 12,
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: `${sp.F}px ${sp.F}px ${sp.E}px` }}>
          <div style={{ fontSize: fs.lg, fontWeight: fw.semibold, color: c['content-primary'] }}>
            Caching Settings
          </div>
        </div>
        <div style={{ height: 1, backgroundColor: c['border-divider'] }} />

        {/* Settings rows */}
        <div style={{ padding: `${sp.C}px ${sp.F}px` }}>

          {/* Cache Window */}
          <div style={rowStyle}>
            <div style={labelColStyle}>
              <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'], marginBottom: sp.A }}>
                Cache Window
              </div>
              <div style={{ fontSize: fs.sm, color: c['content-secondary'], lineHeight: 1.55 }}>
                How much historical data to be included in the cache. Older queries will route to the live warehouse.
              </div>
            </div>
            <div style={controlColStyle}>
              <select
                value={cacheWindow}
                onChange={e => setCacheWindow(e.target.value)}
                style={{ ...selectStyle, minWidth: 140 }}
              >
                {CACHE_WINDOWS.map(w => <option key={w}>{w}</option>)}
              </select>
            </div>
          </div>

          <div style={{ height: 1, backgroundColor: c['border-divider'] }} />

          {/* Date reference */}
          <div style={rowStyle}>
            <div style={labelColStyle}>
              <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'], marginBottom: sp.A }}>
                Date reference
              </div>
              <div style={{ fontSize: fs.sm, color: c['content-secondary'], lineHeight: 1.55 }}>
                Which column is used to measure the cache window
              </div>
            </div>
            <div style={controlColStyle}>
              <select
                value={dateRef}
                onChange={e => setDateRef(e.target.value)}
                style={{ ...selectStyle, minWidth: 220 }}
              >
                {DATE_REFS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div style={{ height: 1, backgroundColor: c['border-divider'] }} />

          {/* Refresh Frequency */}
          <div style={rowStyle}>
            <div style={labelColStyle}>
              <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'], marginBottom: sp.A }}>
                Refresh Frequency
              </div>
              <div style={{ fontSize: fs.sm, color: c['content-secondary'], lineHeight: 1.55 }}>
                How often should the cache be refreshed.
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: sp.B }}>
              {/* Line 1: frequency + time controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <select
                  value={frequency}
                  onChange={e => setFrequency(e.target.value)}
                  style={{ ...selectStyle, minWidth: 100 }}
                >
                  {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
                </select>
                <span style={{ fontSize: fs.sm, color: c['content-secondary'] }}>at</span>
                <select
                  value={hour}
                  onChange={e => setHour(e.target.value)}
                  style={{ ...selectStyle, width: 64 }}
                >
                  {HOURS.map(h => <option key={h}>{h}</option>)}
                </select>
                <span style={{ fontSize: fs.sm, color: c['content-secondary'], fontWeight: fw.medium }}>:</span>
                <select
                  value={minute}
                  onChange={e => setMinute(e.target.value)}
                  style={{ ...selectStyle, width: 64 }}
                >
                  {MINUTES.map(m => <option key={m}>{m}</option>)}
                </select>
                <span style={{ fontSize: fs.sm, color: c['content-secondary'] }}>hours</span>
              </div>

              {/* Line 2: exclude weekends + timezone */}
              <div style={{ display: 'flex', alignItems: 'center', gap: sp.C, justifyContent: 'flex-end' }}>
                <input
                  id="exclude-weekends"
                  type="checkbox"
                  checked={excludeWeekends}
                  onChange={e => setExcludeWeekends(e.target.checked)}
                  style={{ width: 14, height: 14, cursor: 'pointer', accentColor: c['background-brand'] }}
                />
                <label
                  htmlFor="exclude-weekends"
                  style={{ fontSize: fs.sm, color: c['content-primary'], cursor: 'pointer', userSelect: 'none' }}
                >
                  Exclude weekends
                </label>
                <span style={{ fontSize: fs.sm, color: c['content-brand'], cursor: 'pointer' }}>
                  Asia/Calcutta
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Info banner */}
        <div style={{
          margin: `0 ${sp.F}px ${sp.F}px`,
          padding: `${sp.C}px ${sp.D}px`,
          backgroundColor: c['background-subtle'],
          borderRadius: 8,
          display: 'flex', alignItems: 'flex-start', gap: sp.C,
          fontSize: fs.sm, color: c['content-secondary'],
        }}>
          <span style={{ fontSize: 16, lineHeight: 1.2, flexShrink: 0 }}>ⓘ</span>
          <span>First Cache will be done today. Future refreshes will follow the schedule above.</span>
        </div>

        {/* Footer */}
        <div style={{
          padding: `${sp.D}px ${sp.F}px`,
          borderTop: `1px solid ${c['border-divider']}`,
          display: 'flex', justifyContent: 'flex-end', gap: sp.B,
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: `${sp.B}px ${sp.E}px`,
              border: `1px solid ${c['border-default']}`,
              borderRadius: 20, backgroundColor: 'transparent',
              fontSize: fs.sm, color: c['content-secondary'],
              cursor: 'pointer', fontFamily: ff.primary,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: `${sp.B}px ${sp.E}px`,
              border: 'none', borderRadius: 20,
              backgroundColor: c['background-brand'],
              fontSize: fs.sm, fontWeight: fw.medium, color: '#fff',
              cursor: 'pointer', fontFamily: ff.primary,
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default CacheSettingsModal;
