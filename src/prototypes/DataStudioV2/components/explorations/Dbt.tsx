import React, { useState } from 'react';
import { c, sp, fs, fw, ff } from '../../styles';
import { Button } from '../../../../components/Button';
import { Card } from '../../../../components/Card';
import Shell from '../Shell';
import { SubStateBar } from './ExplorationFrame';

type SubState = 'empty' | 'importing' | 'imported' | 'issues' | 'fix-flow' | 'published';

const SUBTABS = [
  { id: 'empty',     label: 'Empty (no dbt yet)' },
  { id: 'importing', label: 'Importing' },
  { id: 'imported',  label: 'Imported — review' },
  { id: 'issues',    label: 'Issues for one model' },
  { id: 'fix-flow',  label: 'AI fix in action' },
  { id: 'published', label: 'Published' },
];

const DbtLogo: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <div style={{ width: size, height: size, borderRadius: 6, backgroundColor: '#FF694A', color: 'white', fontSize: size * 0.4, fontWeight: fw.bold, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>d</div>
);

const PageHeader: React.FC<{ title: string; subtitle?: string; actions?: React.ReactNode; back?: () => void }> = ({ title, subtitle, actions, back }) => (
  <div style={{ flexShrink: 0, padding: `${sp.D}px ${sp.H}px`, backgroundColor: c['background-base'], borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: sp.D }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: sp.C }}>
      {back && <button onClick={back} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: c['content-secondary'], fontSize: 14 }}>←</button>}
      <div>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: fw.semibold, color: c['content-primary'], fontFamily: ff.primary }}>{title}</h1>
        {subtitle && <div style={{ fontSize: fs.xs, color: c['content-tertiary'], marginTop: 2, fontFamily: ff.primary }}>{subtitle}</div>}
      </div>
    </div>
    {actions && <div style={{ display: 'flex', gap: sp.B }}>{actions}</div>}
  </div>
);

// ── Empty ────────────────────────────────────────────────────────────────────

const EmptyState: React.FC = () => (
  <>
    <PageHeader title="dbt integration" subtitle="Bring your dbt models into ThoughtSpot" />
    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: c['background-sunken'], padding: `${sp.J}px ${sp.H}px` }}>
      <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' as const, fontFamily: ff.primary }}>
        <DbtLogo size={56} />
        <h2 style={{ margin: 0, marginTop: sp.D, fontSize: 22, fontWeight: fw.semibold, color: c['content-primary'] }}>No dbt project connected</h2>
        <p style={{ marginTop: sp.B, marginBottom: sp.G, fontSize: fs.sm, color: c['content-secondary'] }}>
          dbt is set up from a warehouse connection. Open the connection you want to attach dbt to, then go to its <strong>dbt integration</strong> tab.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: sp.C, textAlign: 'left' as const, marginBottom: sp.G }}>
          {[
            { t: 'Live link',          d: 'dbt changes auto-sync. Refresh on demand.' },
            { t: 'AI catches issues',  d: 'Chasm traps, missing synonyms — flagged before publish.' },
            { t: 'Push back to dbt',   d: 'Promote your overrides back to your dbt project.' },
          ].map(b => (
            <Card key={b.t}>
              <div style={{ padding: sp.D }}>
                <div style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'] }}>{b.t}</div>
                <div style={{ fontSize: fs.xs, color: c['content-secondary'], marginTop: sp.A, lineHeight: 1.5 }}>{b.d}</div>
              </div>
            </Card>
          ))}
        </div>
        <Button variant="primary" size="basic">Open snowflake-prod →</Button>
      </div>
    </div>
  </>
);

// ── Importing ────────────────────────────────────────────────────────────────

const ImportingState: React.FC = () => (
  <>
    <PageHeader title="Importing dbt project" subtitle="analytics · from dbt Cloud · linked to snowflake-prod" />
    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: c['background-sunken'], padding: `${sp.J}px ${sp.H}px` }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <Card>
          <div style={{ padding: sp.E }}>
            {[
              { label: 'Reading manifest.json',                                  status: 'done' },
              { label: 'Resolving warehouse views',                              status: 'done' },
              { label: 'Translating 18 models to draft TS Models',               status: 'in-progress' },
              { label: 'Running validation pass (chasm traps, joins, descriptions)', status: 'pending' },
            ].map((s, i, arr) => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: sp.C, padding: `${sp.B + 2}px 0`, borderBottom: i < arr.length - 1 ? `1px solid ${c['background-subtle']}` : 'none' }}>
                <span style={{
                  width: 16, height: 16, borderRadius: 8,
                  backgroundColor: s.status === 'done' ? c['content-success'] : s.status === 'in-progress' ? c['content-brand'] : c['background-subtle'],
                  color: 'white', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{s.status === 'done' ? '✓' : s.status === 'in-progress' ? '↻' : ''}</span>
                <span style={{ fontSize: fs.sm, color: s.status === 'pending' ? c['content-tertiary'] : c['content-primary'], fontFamily: ff.primary }}>{s.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  </>
);

// ── Imported review ──────────────────────────────────────────────────────────

const ImportedState: React.FC = () => (
  <>
    <PageHeader
      title="analytics imported"
      subtitle="18 draft models from your dbt project · ready for review"
      actions={<>
        <Button variant="secondary" size="basic">Save all as drafts</Button>
        <Button variant="primary"   size="basic">Review issues</Button>
      </>}
    />
    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: c['background-sunken'], padding: `${sp.E}px ${sp.H}px` }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: sp.C, marginBottom: sp.E }}>
          {[
            { k: 'Models',   v: '18',                                            },
            { k: 'Blocking', v: '1',  sub: '1 broken reference', tone: 'danger' as const  },
            { k: 'Advisory', v: '14', sub: 'chasm traps, missing synonyms…', tone: 'warning' as const },
            { k: 'Ready',    v: '3',  sub: 'all checks pass',    tone: 'success' as const },
          ].map(s => (
            <Card key={s.k}>
              <div style={{ padding: sp.D }}>
                <div style={{ fontSize: fs.xs, color: c['content-tertiary'], fontFamily: ff.primary }}>{s.k}</div>
                <div style={{ fontSize: 22, fontWeight: fw.semibold, color: s.tone ? c[`content-${s.tone}` as keyof typeof c] as string : c['content-primary'], marginTop: 2, fontFamily: ff.primary }}>{s.v}</div>
                {s.sub && <div style={{ fontSize: fs.xs, color: c['content-secondary'], marginTop: 2, fontFamily: ff.primary }}>{s.sub}</div>}
              </div>
            </Card>
          ))}
        </div>

        <Card>
          <div style={{ padding: `${sp.B}px ${sp.D}px`, backgroundColor: c['background-subtle'], borderBottom: `1px solid ${c['border-divider']}`, fontSize: 11, fontWeight: fw.medium, color: c['content-secondary'], textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: ff.primary }}>
            Imported models
          </div>
          {[
            { name: 'fct_revenue',         status: 'advisory' as const, advisories: 2 },
            { name: 'fct_orders',          status: 'blocking' as const, err: 'broken ref: customers.email' },
            { name: 'dim_customers',       status: 'ready' as const },
            { name: 'dim_campaigns',       status: 'advisory' as const, advisories: 1 },
            { name: 'fct_marketing_perf',  status: 'advisory' as const, advisories: 3 },
          ].map((m, i, arr) => (
            <div key={m.name} style={{
              display: 'grid', gridTemplateColumns: '24px 2fr 2.4fr 80px', gap: sp.C,
              padding: `${sp.B + 1}px ${sp.D}px`, alignItems: 'center',
              borderTop: i > 0 ? `1px solid ${c['border-divider']}` : 'none', fontSize: fs.sm, fontFamily: ff.primary,
            }}>
              <span style={{ color: '#FF694A' }}>◆</span>
              <code style={{ fontFamily: ff.mono, color: c['content-brand'] }}>{m.name}</code>
              <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
                {m.status === 'ready' && <span style={{ fontSize: fs.xs, color: c['content-success'], fontWeight: fw.medium }}>● All checks pass</span>}
                {m.status === 'advisory' && <span style={{ fontSize: fs.xs, color: c['content-warning'], fontWeight: fw.medium }}>▲ {m.advisories} advisory</span>}
                {m.status === 'blocking' && <span style={{ fontSize: fs.xs, color: c['content-danger'], fontWeight: fw.medium }}>● {m.err}</span>}
              </div>
              <Button variant="tertiary" size="small">Review</Button>
            </div>
          ))}
        </Card>
      </div>
    </div>
  </>
);

// ── Issues ───────────────────────────────────────────────────────────────────

const IssuesState: React.FC = () => (
  <>
    <PageHeader
      title="fct_marketing_perf"
      subtitle="3 advisory issues · 0 blocking"
      back={() => {}}
      actions={<>
        <Button variant="secondary" size="basic">Keep as draft</Button>
        <Button variant="primary"   size="basic">Publish · 3 advisories remain</Button>
      </>}
    />
    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: c['background-sunken'], padding: `${sp.E}px ${sp.H}px` }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <div style={{ fontSize: 11, color: c['content-secondary'], textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: fw.semibold, marginBottom: sp.B, fontFamily: ff.primary }}>
          Blocking <span style={{ color: c['content-tertiary'] }}>· must resolve to publish</span>
        </div>
        <Card>
          <div style={{ padding: sp.D, fontSize: fs.sm, color: c['content-tertiary'], fontFamily: ff.primary }}>No blocking issues for this model.</div>
        </Card>

        <div style={{ fontSize: 11, color: c['content-secondary'], textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: fw.semibold, marginTop: sp.E, marginBottom: sp.B, fontFamily: ff.primary }}>
          Advisory <span style={{ color: c['content-tertiary'] }}>· publish anyway, fix later</span>
        </div>
        {[
          { title: 'Chasm trap on transactions ↔ order_items ↔ returns', body: 'Joining transactions to both order_items and returns via order_id will inflate SUM(revenue). Each revenue row is duplicated for every matching return.', type: 'Correctness', fix: 'Pre-aggregate returns before joining' },
          { title: 'Spotter readiness — missing synonym',                body: "Spotter wouldn't answer 'top customers by spend' correctly. The column lifetime_value has no synonym.", type: 'Spotter readiness', fix: 'Add synonyms: "spend", "customer value", "LTV"' },
          { title: 'Missing column descriptions',                         body: '6 of 14 columns have no description. AI agents can\'t interpret them confidently.', type: 'Context', fix: 'Generate descriptions from dbt schema.yml + column patterns' },
        ].map(iss => (
          <Card key={iss.title}>
            <div style={{ padding: sp.D, marginBottom: sp.B }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, marginBottom: sp.A }}>
                <span style={{ fontSize: 14 }}>▲</span>
                <span style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'], fontFamily: ff.primary }}>{iss.title}</span>
                <span style={{ fontSize: 11, padding: `1px ${sp.B}px`, borderRadius: 3, backgroundColor: c['background-warning'], color: c['content-warning'], fontWeight: fw.medium }}>{iss.type}</span>
              </div>
              <div style={{ fontSize: fs.xs, color: c['content-secondary'], lineHeight: 1.5, marginBottom: sp.C, marginLeft: 22, fontFamily: ff.primary }}>{iss.body}</div>
              <div style={{ marginLeft: 22, padding: sp.B, borderRadius: 4, backgroundColor: c['background-information'], display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, fontFamily: ff.primary }}>
                  <span style={{ fontSize: 12 }}>✦</span>
                  <span style={{ fontSize: fs.xs, color: c['content-brand'], fontWeight: fw.medium }}>AI fix: {iss.fix}</span>
                </div>
                <div style={{ display: 'flex', gap: sp.A }}>
                  <Button variant="tertiary" size="small">Apply</Button>
                  <Button variant="tertiary" size="small">Dismiss</Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  </>
);

// ── Fix flow ─────────────────────────────────────────────────────────────────

const FixFlowState: React.FC = () => (
  <>
    <PageHeader title="AI fix · Pre-aggregate returns before join" subtitle="fct_marketing_perf" back={() => {}} actions={<>
      <Button variant="secondary" size="basic">Reject</Button>
      <Button variant="secondary" size="basic">Edit fix</Button>
      <Button variant="primary"   size="basic">Apply fix</Button>
    </>} />
    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: c['background-sunken'], padding: `${sp.E}px ${sp.H}px` }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <Card>
          <div style={{ padding: sp.D }}>
            <div style={{ fontSize: fs.sm, fontWeight: fw.semibold, marginBottom: sp.B, color: c['content-primary'], fontFamily: ff.primary }}>The problem</div>
            <div style={{ fontSize: fs.xs, color: c['content-secondary'], lineHeight: 1.5, fontFamily: ff.primary }}>
              Your join graph: <code style={{ fontFamily: ff.mono, color: c['content-brand'] }}>transactions ←(order_id)→ order_items</code> AND <code style={{ fontFamily: ff.mono, color: c['content-brand'] }}>transactions ←(order_id)→ returns</code>. When a transaction has both line items and returns, SUM(transactions.revenue) gets multiplied. Spotter answers will be inflated.
            </div>
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp.C, marginTop: sp.D }}>
          <Card>
            <div style={{ padding: sp.D }}>
              <div style={{ fontSize: 10, color: c['content-tertiary'], textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: sp.B, fontFamily: ff.primary, fontWeight: fw.medium }}>Before</div>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: c['content-secondary'], fontSize: fs.xs, fontFamily: ff.mono }}>{`transactions
  ⨝ order_items ON order_id
  ⨝ returns     ON order_id
-- chasm trap`}</pre>
            </div>
          </Card>
          <Card>
            <div style={{ padding: sp.D, backgroundColor: c['background-success'] }}>
              <div style={{ fontSize: 10, color: c['content-tertiary'], textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: sp.B, fontFamily: ff.primary, fontWeight: fw.medium }}>After</div>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: c['content-success'], fontSize: fs.xs, fontFamily: ff.mono }}>{`transactions
  ⨝ order_items ON order_id
  ⨝ (returns_agg) ON order_id
   where returns_agg
     pre-summed by order_id`}</pre>
            </div>
          </Card>
        </div>

        <Card>
          <div style={{ padding: sp.D, marginTop: sp.D }}>
            <div style={{ fontSize: fs.sm, fontWeight: fw.semibold, marginBottom: sp.B, color: c['content-primary'], fontFamily: ff.primary }}>What this changes</div>
            <ul style={{ margin: 0, paddingLeft: sp.D, fontSize: fs.xs, color: c['content-secondary'], lineHeight: 1.7, fontFamily: ff.primary }}>
              <li>Adds a CTE <code style={{ fontFamily: ff.mono }}>returns_agg</code> that sums returns per order_id</li>
              <li>Replaces the direct returns join with the aggregated one</li>
              <li>SUM(revenue) - SUM(returns_agg.amount) = correct net revenue</li>
              <li>Will ask: "Promote this fix back to your dbt project?" after apply</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  </>
);

// ── Published ────────────────────────────────────────────────────────────────

const PublishedState: React.FC = () => (
  <>
    <PageHeader title="Published" subtitle="18 models live · available to your team" actions={<>
      <Button variant="secondary" size="basic">View advisory issues</Button>
      <Button variant="primary"   size="basic">Open in Models →</Button>
    </>} />
    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: c['background-sunken'], padding: `${sp.J}px ${sp.H}px` }}>
      <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' as const, fontFamily: ff.primary }}>
        <div style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: c['background-success'], display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', color: c['content-success'], fontSize: 28 }}>✓</div>
        <h2 style={{ margin: 0, marginTop: sp.D, fontSize: 22, fontWeight: fw.semibold, color: c['content-primary'] }}>18 models live</h2>
        <p style={{ marginTop: sp.B, marginBottom: sp.G, fontSize: fs.sm, color: c['content-secondary'] }}>
          Your team can now query them in Spotter. 14 advisory items remain — fix anytime.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: sp.C, textAlign: 'left' as const }}>
          {[
            ['Live link',      'Auto-pulls dbt changes'],
            ['On-demand sync', 'Refresh anytime from Models'],
            ['Push-back',      'Promote your overrides back to dbt'],
          ].map(([t, d]) => (
            <Card key={t}><div style={{ padding: sp.C }}>
              <div style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'] }}>{t}</div>
              <div style={{ fontSize: fs.xs, color: c['content-secondary'], marginTop: 2 }}>{d}</div>
            </div></Card>
          ))}
        </div>
      </div>
    </div>
  </>
);

// ── Top-level ────────────────────────────────────────────────────────────────

export const DbtExploration: React.FC = () => {
  const [state, setState] = useState<SubState>('empty');
  return (
    <Shell activeNav="connections" onNavChange={() => {}}>
      <SubStateBar subtabs={SUBTABS} active={state} onChange={(id) => setState(id as SubState)} />
      {state === 'empty'     && <EmptyState />}
      {state === 'importing' && <ImportingState />}
      {state === 'imported'  && <ImportedState />}
      {state === 'issues'    && <IssuesState />}
      {state === 'fix-flow'  && <FixFlowState />}
      {state === 'published' && <PublishedState />}
    </Shell>
  );
};
