import React, { useState } from 'react';
import { c, sp, fs, fw, ff } from '../styles';
import { Button } from '../../../components/Button';

// ── Types ─────────────────────────────────────────────────────────────────────

type ModelStatus = 'draft' | 'published';

interface ExternalModel {
  name:       string;
  project:    string;
  status:     ModelStatus;
  issues:     string;
  lastSynced: string;
}

const MODELS: ExternalModel[] = [
  { name: 'fct_revenue',        project: 'analytics', status: 'draft',     issues: '2 advisory',                lastSynced: 'just now' },
  { name: 'fct_orders',         project: 'analytics', status: 'draft',     issues: '1 blocking',                lastSynced: 'just now' },
  { name: 'dim_customers',      project: 'analytics', status: 'draft',     issues: '—',                         lastSynced: 'just now' },
  { name: 'dim_campaigns',      project: 'analytics', status: 'draft',     issues: '1 advisory',                lastSynced: 'just now' },
  { name: 'fct_marketing_perf', project: 'analytics', status: 'draft',     issues: '3 advisory',                lastSynced: 'just now' },
  { name: 'mkt_channel_perf',   project: 'marketing', status: 'draft',     issues: '—',                         lastSynced: 'just now' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const DbtBadge: React.FC = () => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: sp.A,
    fontSize: 12, fontWeight: fw.semibold, fontFamily: ff.primary,
    color: '#FF694A',
    padding: `1px 6px`, borderRadius: 3,
    backgroundColor: 'rgba(255,105,74,0.08)',
    border: '1px solid rgba(255,105,74,0.2)',
  }}>
    ◆ dbt
  </span>
);

const StatusBadge: React.FC<{ status: ModelStatus }> = ({ status }) => (
  <span style={{
    fontSize: fs.xs, fontFamily: ff.primary,
    color: status === 'published' ? c['content-success'] : c['content-secondary'],
    fontWeight: fw.medium,
  }}>
    {status === 'published' ? 'Published' : 'Draft'}
  </span>
);

const IssueLabel: React.FC<{ issues: string }> = ({ issues }) => {
  const isBlocking = issues.includes('blocking');
  const isAdvisory = issues.includes('advisory');
  return (
    <span style={{
      fontSize: fs.xs, fontFamily: ff.primary,
      color: isBlocking ? c['content-danger'] : isAdvisory ? '#B45309' : c['content-tertiary'],
    }}>
      {issues}
    </span>
  );
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface ExternalModelsPageProps {
  onReviewIssues: (modelName: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

const ExternalModelsPage: React.FC<ExternalModelsPageProps> = ({ onReviewIssues }) => {
  const [syncing, setSyncing] = useState(false);
  const [syncedAt, setSyncedAt] = useState('just now');

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setSyncedAt('just now');
    }, 1400);
  };

  return (
    <>
      {/* Page header */}
      <div style={{
        flexShrink: 0,
        padding: `${sp.D}px ${sp.G}px`,
        backgroundColor: c['background-base'],
        borderBottom: `1px solid ${c['border-divider']}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: fw.semibold, color: c['content-primary'], fontFamily: ff.primary }}>
            External models
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, marginTop: sp.A }}>
            <span style={{ fontSize: fs.xs, color: c['content-tertiary'], fontFamily: ff.primary }}>
              {MODELS.length} models · synced from dbt analytics ·{' '}
            </span>
            {syncing ? (
              <span style={{ fontSize: fs.xs, color: c['content-brand'], fontFamily: ff.primary }}>Syncing…</span>
            ) : (
              <>
                <span style={{ fontSize: fs.xs, color: c['content-tertiary'], fontFamily: ff.primary }}>
                  Last synced {syncedAt}
                </span>
                <button
                  onClick={handleSync}
                  style={{ fontSize: fs.xs, color: c['content-brand'], fontFamily: ff.primary, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                >
                  Sync now
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tab strip */}
      <div style={{
        flexShrink: 0,
        display: 'flex', gap: 0,
        padding: `0 ${sp.G}px`,
        backgroundColor: c['background-base'],
        borderBottom: `1px solid ${c['border-divider']}`,
      }}>
        {['dbt models', 'Semantic views'].map((tab, i) => (
          <div key={tab} style={{
            padding: `${sp.C}px ${sp.D}px`,
            fontSize: fs.sm, fontFamily: ff.primary,
            color: i === 0 ? c['content-brand'] : c['content-secondary'],
            fontWeight: i === 0 ? fw.medium : fw.regular,
            borderBottom: i === 0 ? `2px solid ${c['content-brand']}` : '2px solid transparent',
            cursor: 'pointer',
          }}>
            {tab}
          </div>
        ))}
      </div>

      {/* Model list */}
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: c['background-sunken'], padding: `${sp.E}px ${sp.G}px` }}>
        <div style={{
          backgroundColor: c['background-base'],
          border: `1px solid ${c['border-divider']}`,
          borderRadius: 8, overflow: 'hidden',
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '2.5fr 1.2fr 1fr 1.2fr 1.2fr auto',
            gap: sp.C, padding: `${sp.B}px ${sp.D}px`,
            backgroundColor: c['background-subtle'],
            borderBottom: `1px solid ${c['border-divider']}`,
          }}>
            {['Model', 'Source', 'Status', 'Issues', 'Last synced', ''].map(h => (
              <div key={h} style={{
                fontSize: 12, fontWeight: fw.medium, color: c['content-secondary'],
                fontFamily: ff.primary, textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>
                {h}
              </div>
            ))}
          </div>

          {/* Rows */}
          {MODELS.map((m, i) => (
            <div
              key={m.name}
              style={{
                display: 'grid', gridTemplateColumns: '2.5fr 1.2fr 1fr 1.2fr 1.2fr auto',
                gap: sp.C, padding: `${sp.C}px ${sp.D}px`,
                alignItems: 'center',
                borderTop: i > 0 ? `1px solid ${c['border-divider']}` : 'none',
                cursor: 'default',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {/* Model name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
                <code style={{ fontFamily: ff.mono, fontSize: fs.sm, color: c['content-brand'] }}>
                  {m.name}
                </code>
              </div>

              {/* Source */}
              <div style={{ display: 'flex', alignItems: 'center', gap: sp.A }}>
                <DbtBadge />
                <span style={{ fontSize: fs.xs, color: c['content-tertiary'], fontFamily: ff.primary }}>
                  {m.project}
                </span>
              </div>

              {/* Status */}
              <StatusBadge status={m.status} />

              {/* Issues */}
              <IssueLabel issues={m.issues} />

              {/* Last synced */}
              <span style={{ fontSize: fs.xs, color: c['content-tertiary'], fontFamily: ff.primary }}>
                {m.lastSynced}
              </span>

              {/* Actions */}
              <div style={{ display: 'flex', gap: sp.A, justifyContent: 'flex-end' }}>
                {m.issues !== '—' && (
                  <button
                    onClick={() => onReviewIssues(m.name)}
                    style={{
                      padding: `${sp.A}px ${sp.B + 2}px`, borderRadius: 5,
                      border: `1px solid ${c['border-default']}`,
                      backgroundColor: 'transparent', cursor: 'pointer',
                      fontSize: 12, fontFamily: ff.primary, color: c['content-secondary'],
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    Review issues
                  </button>
                )}
                <Button variant="tertiary" size="small">Publish</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ExternalModelsPage;
