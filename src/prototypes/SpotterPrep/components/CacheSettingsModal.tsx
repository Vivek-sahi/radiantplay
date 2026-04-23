import React, { useState } from 'react';
import { c, sp, fs, fw, ff } from '../styles';

interface CacheSettingsModalProps {
  onConfirm: (frequency: string) => void;
  onCancel: () => void;
}

const FREQUENCIES = [
  { value: 'daily',   label: 'Daily',   description: 'Refreshed every 24 hours' },
  { value: 'weekly',  label: 'Weekly',  description: 'Refreshed every 7 days' },
  { value: 'monthly', label: 'Monthly', description: 'Refreshed on the 1st of each month' },
];

const CacheSettingsModal: React.FC<CacheSettingsModalProps> = ({ onConfirm, onCancel }) => {
  const [selected, setSelected] = useState('daily');

  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'rgba(29,35,47,0.5)',
      zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 440,
        backgroundColor: c['background-base'],
        borderRadius: 12,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        fontFamily: ff.primary,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: `${sp.F}px`,
          borderBottom: `1px solid ${c['border-divider']}`,
        }}>
          <div style={{ fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'] }}>
            Set up caching
          </div>
          <div style={{ fontSize: fs.xs, color: c['content-secondary'], marginTop: sp.A }}>
            SpotterPrep requires cached data. Choose how often this model's data should refresh.
          </div>
        </div>

        {/* Frequency options */}
        <div style={{ padding: `${sp.D}px ${sp.F}px`, display: 'flex', flexDirection: 'column', gap: sp.B }}>
          {FREQUENCIES.map(freq => (
            <button
              key={freq.value}
              onClick={() => setSelected(freq.value)}
              style={{
                textAlign: 'left',
                padding: `${sp.C}px ${sp.D}px`,
                borderRadius: 8,
                border: `1.5px solid ${selected === freq.value ? c['border-brand'] : c['border-default']}`,
                backgroundColor: selected === freq.value ? '#eff6ff' : c['background-base'],
                cursor: 'pointer',
                fontFamily: ff.primary,
                display: 'flex', alignItems: 'center', gap: sp.C,
              }}
            >
              <div style={{
                width: 16, height: 16, borderRadius: '50%',
                border: `2px solid ${selected === freq.value ? c['content-brand'] : c['border-default']}`,
                backgroundColor: selected === freq.value ? c['content-brand'] : 'transparent',
                flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {selected === freq.value && (
                  <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#fff' }} />
                )}
              </div>
              <div>
                <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'] }}>
                  {freq.label}
                </div>
                <div style={{ fontSize: fs.xs, color: c['content-secondary'], marginTop: 1 }}>
                  {freq.description}
                </div>
              </div>
            </button>
          ))}
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
              padding: `${sp.B}px ${sp.D}px`,
              border: `1px solid ${c['border-default']}`,
              borderRadius: 6, backgroundColor: 'transparent',
              fontSize: fs.sm, color: c['content-secondary'],
              cursor: 'pointer', fontFamily: ff.primary,
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selected)}
            style={{
              padding: `${sp.B}px ${sp.D}px`,
              border: 'none', borderRadius: 6,
              backgroundColor: c['background-brand'],
              fontSize: fs.sm, fontWeight: fw.medium, color: '#fff',
              cursor: 'pointer', fontFamily: ff.primary,
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default CacheSettingsModal;
