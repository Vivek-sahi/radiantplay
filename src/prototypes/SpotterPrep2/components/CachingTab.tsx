import React, { useState, useEffect } from 'react';
import { c, sp, fs, fw, ff } from '../styles';
import { MODEL, PREP_HISTORY, CACHE_DISPLAY, CACHE_ANALYTICS } from '../data/mockData';
import type { QualityState } from './QualityTab';
import CacheSettingsModal from './CacheSettingsModal';

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });

const fmtDateShort = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

// ── Props ─────────────────────────────────────────────────────────────────────

interface CachingTabProps {
  modelId: string;
  qualityState: QualityState;
  onEnableCache: () => void;
  onEditCache: () => void;
  autoOpenModal?: boolean;
  onAutoOpenConsumed?: () => void;
}

// ── CachingTab ────────────────────────────────────────────────────────────────

const CachingTab: React.FC<CachingTabProps> = ({ qualityState, onEnableCache, autoOpenModal, onAutoOpenConsumed }) => {
  const [showModal, setShowModal]           = useState(false);
  const [showEditModal, setShowEditModal]   = useState(false);
  const [isRefreshing, setIsRefreshing]     = useState(false);
  const [isCachingSetup, setIsCachingSetup] = useState(false);

  useEffect(() => {
    if (autoOpenModal) {
      setShowModal(true);
      onAutoOpenConsumed?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Empty state ────────────────────────────────────────────────────────────

  if (qualityState === 'not-cached' && !isCachingSetup) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: sp.D, padding: sp.J }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: c['background-subtle'], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, color: c['content-secondary'] }}>
          ⏱
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'], marginBottom: sp.B }}>
            Caching not enabled
          </div>
          <div style={{ fontSize: fs.md, color: c['content-secondary'], lineHeight: 1.6, maxWidth: 400 }}>
            Cache this model to get a quality score, run automatic quality checks, and keep data fresh on a schedule.
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: `${sp.C}px ${sp.E}px`,
            border: 'none', borderRadius: 6,
            backgroundColor: c['background-brand'],
            color: '#fff', fontSize: fs.md, fontWeight: fw.medium,
            cursor: 'pointer', fontFamily: ff.primary,
          }}
        >
          Set up caching
        </button>
        {showModal && (
          <CacheSettingsModal
            onConfirm={() => {
              setShowModal(false);
              setIsCachingSetup(true);
              onEnableCache();
              setTimeout(() => setIsCachingSetup(false), 2200);
            }}
            onCancel={() => setShowModal(false)}
          />
        )}
      </div>
    );
  }

  // ── Caching setup loading state ────────────────────────────────────────────

  if (isCachingSetup) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: sp.D, padding: sp.J }}>
        <style>{`@keyframes spin-cs { to { transform: rotate(360deg); } }`}</style>
        <div style={{
          width: 380, backgroundColor: c['background-base'],
          border: `1px solid ${c['border-default']}`, borderRadius: 12,
          padding: sp.F, boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          textAlign: 'center',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: sp.D }}>
            <span style={{
              width: 24, height: 24, borderRadius: '50%',
              border: `2.5px solid ${c['border-divider']}`,
              borderTopColor: c['background-brand'],
              display: 'inline-block',
              animation: 'spin-cs 0.8s linear infinite',
            }} />
          </div>
          <div style={{ fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'], marginBottom: sp.B }}>
            Setting up cache
          </div>
          <div style={{ fontSize: fs.sm, color: c['content-secondary'] }}>
            Running first cache job for hr-analytics
          </div>
        </div>
      </div>
    );
  }

  // ── Helpers for filled state ───────────────────────────────────────────────

  const settingsRows: { label: string; value: string; secondary?: string }[] = [
    { label: 'Cache window',          value: CACHE_DISPLAY.cacheWindow },
    { label: 'Date reference column', value: CACHE_DISPLAY.dateReferenceColumn },
    { label: 'Refresh frequency',     value: MODEL.cacheScheduleLabel, secondary: 'Excluding weekends' },
    { label: 'Cache size',            value: CACHE_DISPLAY.cacheSize },
    { label: 'Number of rows',        value: MODEL.totalRows.toLocaleString() },
    { label: 'Next scheduled run',    value: fmtDateShort(MODEL.nextCacheAt) },
  ];

  const analyticsItems = [
    { label: 'Total queries fired',    value: CACHE_ANALYTICS.totalQueriesFired.toLocaleString() },
    { label: 'Queries on cached data', value: `${CACHE_ANALYTICS.cachedQueryPct}% (${CACHE_ANALYTICS.cachedQueryCount.toLocaleString()})` },
    { label: 'Queries on live data',   value: `${CACHE_ANALYTICS.liveQueryPct}% (${CACHE_ANALYTICS.liveQueryCount.toLocaleString()})` },
  ];

  const statusMeta: Record<string, { label: string; color: string }> = {
    passed:  { label: 'Success', color: '#15803d' },
    partial: { label: 'Partial', color: '#b45309' },
    failed:  { label: 'Failure', color: '#dc2626' },
  };

  // ── Styles ─────────────────────────────────────────────────────────────────

  const actionLinkStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: sp.A,
    fontSize: fs.sm, color: c['content-brand'],
    background: 'none', border: 'none',
    cursor: 'pointer', fontFamily: ff.primary, padding: 0,
  };

  const thStyle: React.CSSProperties = {
    padding: `${sp.C}px ${sp.D}px`,
    textAlign: 'left', fontSize: fs.xs, fontWeight: fw.medium,
    color: c['content-secondary'],
    borderBottom: `1px solid ${c['border-divider']}`,
    whiteSpace: 'nowrap',
  };

  const tdStyle: React.CSSProperties = {
    padding: `${sp.D}px ${sp.D}px`,
    borderBottom: `1px solid ${c['border-divider']}`,
    fontSize: fs.sm,
  };

  // ── Filled state ───────────────────────────────────────────────────────────

  return (
    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: c['background-base'] }}>
      <div style={{ padding: sp.F }}>

        {/* Cache Settings */}
        <div style={{ marginBottom: sp.H }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp.D }}>
            <div style={{ fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'] }}>
              Cache Settings
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: sp.E }}>
              <button
                onClick={() => {
                  if (!isRefreshing) {
                    setIsRefreshing(true);
                    setTimeout(() => setIsRefreshing(false), 2000);
                  }
                }}
                style={actionLinkStyle}
              >
                {isRefreshing ? (
                  <>
                    <style>{`@keyframes spin-cach { to { transform: rotate(360deg); } }`}</style>
                    <span style={{
                      width: 12, height: 12, borderRadius: '50%',
                      border: `2px solid ${c['border-divider']}`,
                      borderTopColor: c['content-brand'],
                      display: 'inline-block',
                      animation: 'spin-cach 0.8s linear infinite',
                      flexShrink: 0,
                    }} />
                    Refreshing…
                  </>
                ) : (
                  <>↻ Refresh now</>
                )}
              </button>
              <button onClick={() => setShowEditModal(true)} style={actionLinkStyle}>
                ✏ Edit settings
              </button>
            </div>
          </div>

          {settingsRows.map((row) => (
            <div
              key={row.label}
              style={{
                display: 'grid',
                gridTemplateColumns: '220px 1fr',
                padding: `${sp.C}px 0`,
                borderBottom: `1px solid ${c['border-divider']}`,
              }}
            >
              <div style={{ fontSize: fs.sm, color: c['content-secondary'] }}>{row.label}</div>
              <div>
                <div style={{ fontSize: fs.sm, color: c['content-primary'] }}>{row.value}</div>
                {row.secondary && (
                  <div style={{ fontSize: fs.sm, color: c['content-secondary'], marginTop: 2 }}>{row.secondary}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Analytics */}
        <div style={{ marginBottom: sp.H }}>
          <div style={{ fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'], marginBottom: sp.A }}>
            Analytics
          </div>
          <div style={{ fontSize: fs.sm, color: c['content-secondary'], marginBottom: sp.D }}>
            Based on last cache run · {fmtDate(MODEL.lastCached)}
          </div>
          <div style={{ display: 'flex', gap: sp.D }}>
            {analyticsItems.map(item => (
              <div
                key={item.label}
                style={{
                  flex: 1,
                  border: `1px solid ${c['border-default']}`,
                  borderRadius: 8,
                  padding: sp.D,
                }}
              >
                <div style={{ fontSize: fs.sm, color: c['content-secondary'], marginBottom: sp.B }}>
                  {item.label}
                </div>
                <div style={{ fontSize: fs['2xl'], fontWeight: fw.semibold, color: c['content-primary'] }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Run History */}
        <div>
          <div style={{ fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'], marginBottom: sp.D }}>
            Run History
          </div>
          <div style={{ border: `1px solid ${c['border-divider']}`, borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: fs.sm }}>
              <thead>
                <tr>
                  <th style={thStyle}>Run type</th>
                  <th style={thStyle}>Start time <span style={{ fontSize: 11 }}>ⓘ</span></th>
                  <th style={thStyle}>End time <span style={{ fontSize: 11 }}>ⓘ</span></th>
                  <th style={thStyle}>No. of rows</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Logs</th>
                </tr>
              </thead>
              <tbody>
                {PREP_HISTORY.map(run => {
                  const st = statusMeta[run.status];
                  return (
                    <tr key={run.id}>
                      <td style={{ ...tdStyle, color: c['content-primary'] }}>
                        {run.triggeredBy === 'cache_refresh' ? 'Scheduled' : 'Ad-hoc'}
                      </td>
                      <td style={{ ...tdStyle, color: c['content-secondary'] }}>
                        {fmtDate(run.runAt)}
                      </td>
                      <td style={{ ...tdStyle, color: c['content-secondary'] }}>
                        {fmtDate(run.runAt)}
                      </td>
                      <td style={{ ...tdStyle, color: c['content-secondary'] }}>
                        {MODEL.totalRows.toLocaleString()}
                      </td>
                      <td style={{ ...tdStyle, color: st.color, fontWeight: fw.medium }}>
                        {st.label}
                      </td>
                      <td style={{ ...tdStyle }}>
                        <span style={{ color: c['content-brand'], cursor: 'pointer' }}>View log</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {showEditModal && (
        <CacheSettingsModal
          onConfirm={() => setShowEditModal(false)}
          onCancel={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
};

export default CachingTab;
