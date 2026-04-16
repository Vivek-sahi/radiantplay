import React, { useState } from 'react';
import { c, sp, fs, fw, ff, styles, TAB_BAR_HEIGHT } from '../styles';
import { MODEL, COLUMNS } from '../data/mockData';
import QualityTab, { QualityState } from './QualityTab';

type ModelTab = 'columns' | 'joins' | 'bio_samples' | 'dependents' | 'instructions' | 'quality' | 'caching';

const TABS: { id: ModelTab; label: string }[] = [
  { id: 'columns',      label: 'Columns'      },
  { id: 'joins',        label: 'Joins'        },
  { id: 'bio_samples',  label: 'Data samples' },
  { id: 'dependents',   label: 'Dependents'   },
  { id: 'instructions', label: 'Instructions' },
  { id: 'caching',      label: 'Caching'      },
  { id: 'quality',      label: 'Quality'      },
];

const StubTab: React.FC<{ label: string }> = ({ label }) => (
  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: sp.D, color: c['content-secondary'] }}>
    <div style={{ fontSize: 28, opacity: 0.4 }}>⊞</div>
    <div style={{ fontSize: fs.md, color: c['content-secondary'] }}>{label} tab</div>
  </div>
);

const CachingTab: React.FC = () => (
  <div style={{ padding: sp.F }}>
    <div style={{ fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'], marginBottom: sp.D }}>
      Cache settings
    </div>
    <div style={{
      padding: `${sp.D}px ${sp.F}px`,
      backgroundColor: c['background-subtle'],
      borderRadius: 8,
      border: `1px solid ${c['border-divider']}`,
      display: 'flex', gap: sp.H,
    }}>
      {[
        { label: 'Schedule',   value: MODEL.cacheScheduleLabel },
        { label: 'Last cached', value: 'Apr 9, 2026 at 8:14 AM' },
        { label: 'Next refresh', value: 'Apr 9, 2026 at 2:14 PM' },
        { label: 'Status',      value: 'Active' },
      ].map(item => (
        <div key={item.label}>
          <div style={{ fontSize: fs.md, color: c['content-secondary'] }}>{item.label}</div>
          <div style={{ fontSize: fs.md, fontWeight: fw.medium, color: c['content-primary'], marginTop: 2 }}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ColumnsTab: React.FC = () => (
  <div style={{ flex: 1, overflowY: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: fs.md }}>
      <thead>
        <tr style={{ backgroundColor: c['background-subtle'], position: 'sticky', top: 0 }}>
          {['Column name', 'Description', 'AI context', 'Data type', 'Column type', 'Additive', 'Aggregation'].map(h => (
            <th key={h} style={{
              padding: `${sp.C}px ${sp.D}px`,
              textAlign: 'left', fontSize: fs.md, fontWeight: fw.medium,
              color: c['content-secondary'],
              borderBottom: `1px solid ${c['border-divider']}`,
              whiteSpace: 'nowrap',
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {COLUMNS.slice(0, 18).map((col, i) => (
          <tr key={col.id} style={{ backgroundColor: i % 2 === 0 ? c['background-base'] : c['background-sunken'] }}>
            <td style={{ padding: `${sp.D}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, fontWeight: fw.medium, color: c['content-primary'], whiteSpace: 'nowrap' }}>
              {col.name}
            </td>
            <td style={{ padding: `${sp.D}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, fontSize: fs.md, color: c['content-secondary'], maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Cross-cloud {col.table} field
            </td>
            <td style={{ padding: `${sp.D}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, fontSize: fs.md, color: c['content-secondary'], whiteSpace: 'nowrap' }}>
              AWS billing field
            </td>
            <td style={{ padding: `${sp.D}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, fontSize: 11, fontFamily: 'monospace', color: '#7c3aed', whiteSpace: 'nowrap' }}>
              {col.dataType}
            </td>
            <td style={{ padding: `${sp.D}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, fontSize: fs.md, color: c['content-secondary'] }}>—</td>
            <td style={{ padding: `${sp.D}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, fontSize: fs.md, color: c['content-secondary'] }}>No</td>
            <td style={{ padding: `${sp.D}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, fontSize: fs.md, color: c['content-secondary'] }}>—</td>
          </tr>
        ))}
        <tr>
          <td colSpan={7} style={{ padding: `${sp.D}px ${sp.D}px`, fontSize: fs.md, color: c['content-tertiary'], fontStyle: 'italic', borderTop: `1px solid ${c['border-divider']}` }}>
            Table has 22 rows
          </td>
        </tr>
      </tbody>
    </table>
  </div>
);

const MODEL_NAMES: Record<string, string> = {
  'fnops-final':   'fnops-final',
  'campaign-perf': 'Campaign Performance',
};

interface ModelDetailProps {
  modelId: string;
  onBack: () => void;
  onStartPrep: (path?: string) => void;
  qualityState: QualityState;
  onSetupCache: () => void;
}

const ModelDetail: React.FC<ModelDetailProps> = ({ modelId, onBack, onStartPrep, qualityState, onSetupCache }) => {
  const [activeTab, setActiveTab] = useState<ModelTab>('quality');
  const modelName = MODEL_NAMES[modelId] ?? MODEL.name;
  const requiresCacheForPrep = modelId === 'campaign-perf';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Page header */}
      <div style={styles.pageHeader}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: c['content-secondary'], fontSize: 18, padding: 4, lineHeight: 1,
          display: 'flex', alignItems: 'center',
        }}>←</button>
        <div>
          <div style={{ fontSize: fs.md, color: c['content-secondary'] }}>MODEL</div>
          <div style={{ fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'] }}>{modelName}</div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: sp.B }}>
          <input
            placeholder="Search this model"
            style={{
              padding: `${sp.A}px ${sp.C}px`, borderRadius: 6,
              border: `1px solid ${c['border-default']}`,
              fontSize: fs.md, color: c['content-primary'],
              fontFamily: ff.primary, width: 180,
              backgroundColor: c['background-sunken'],
              outline: 'none',
            }}
          />
          <button style={{
            padding: `${sp.A}px ${sp.C}px`, borderRadius: 6,
            border: `1px solid ${c['border-default']}`,
            fontSize: fs.md, color: c['content-secondary'],
            backgroundColor: 'transparent', cursor: 'pointer', fontFamily: ff.primary,
          }}>Edit model</button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={styles.tabBar}>
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: `0 ${sp.C}px`,
                height: TAB_BAR_HEIGHT,
                background: 'none',
                border: 'none',
                borderBottom: active ? `2px solid ${c['border-brand']}` : '2px solid transparent',
                cursor: 'pointer',
                fontSize: fs.md,
                fontFamily: ff.primary,
                fontWeight: active ? fw.semibold : fw.regular,
                color: active ? c['content-brand'] : c['content-secondary'],
                whiteSpace: 'nowrap',
                marginBottom: -1,
                transition: 'color 0.1s',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: c['background-base'] }}>
        {activeTab === 'columns'      && <ColumnsTab />}
        {activeTab === 'joins'        && <StubTab label="Joins" />}
        {activeTab === 'bio_samples'  && <StubTab label="Data samples" />}
        {activeTab === 'dependents'   && <StubTab label="Dependents" />}
        {activeTab === 'instructions' && <StubTab label="Instructions" />}
        {activeTab === 'caching'      && <CachingTab />}
        {activeTab === 'quality'      && (
          <QualityTab
            qualityState={qualityState}
            onSetupCache={onSetupCache}
            onStartPrep={onStartPrep}
            modelId={modelId}
            requiresCacheForPrep={requiresCacheForPrep}
          />
        )}
      </div>
    </div>
  );
};

export default ModelDetail;
