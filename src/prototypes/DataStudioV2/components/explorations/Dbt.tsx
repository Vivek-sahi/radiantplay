import React, { useState } from 'react';
import { c, sp, fs, fw, ff } from '../../styles';
import { ExplorationFrame, Card, PrimaryButton, GhostButton, Pill } from './ExplorationFrame';

type SubState = 'empty' | 'importing' | 'imported' | 'issues' | 'fix-flow' | 'published';

const SUBTABS = [
  { id: 'empty',     label: 'Empty (no dbt yet)' },
  { id: 'importing', label: 'Importing models' },
  { id: 'imported',  label: 'Imported — review' },
  { id: 'issues',    label: 'Issues review' },
  { id: 'fix-flow',  label: 'AI fix in action' },
  { id: 'published', label: 'Published' },
];

const DbtLogo: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <div style={{ width: size, height: size, borderRadius: 6, backgroundColor: '#FF694A', color: 'white', fontSize: size * 0.4, fontWeight: fw.bold, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>d</div>
);

// ── Empty state ──────────────────────────────────────────────────────────────

const EmptyState: React.FC = () => (
  <div style={{ padding: `${sp.J}px ${sp.H}px`, maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
    <DbtLogo size={56} />
    <h1 style={{ margin: 0, marginTop: sp.D, fontSize: 22, fontWeight: fw.semibold, color: c['content-primary'] }}>Bring your dbt models in</h1>
    <p style={{ marginTop: sp.B, marginBottom: sp.G, fontSize: fs.sm, color: c['content-secondary'] }}>
      dbt models become draft ThoughtSpot models on import. Live link to your dbt project — changes flow both ways.
    </p>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: sp.C, textAlign: 'left' as const, marginBottom: sp.G }}>
      {[
        { icon: '⚡', t: 'Live link', d: 'dbt changes auto-sync. Refresh on demand whenever you need.' },
        { icon: '✦', t: 'AI catches issues', d: 'Chasm traps, missing synonyms, ambiguous joins — flagged before publish.' },
        { icon: '↻', t: 'Push back to dbt', d: 'Overrides you make in ThoughtSpot can be promoted back to your dbt project.' },
      ].map(b => (
        <Card key={b.t} style={{ padding: sp.D }}>
          <div style={{ fontSize: 20 }}>{b.icon}</div>
          <div style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'], marginTop: sp.A }}>{b.t}</div>
          <div style={{ fontSize: fs.xs, color: c['content-secondary'], marginTop: sp.A, lineHeight: 1.5 }}>{b.d}</div>
        </Card>
      ))}
    </div>

    <PrimaryButton>Set up dbt integration</PrimaryButton>
    <div style={{ marginTop: sp.C, fontSize: fs.xs, color: c['content-tertiary'] }}>You'll need a warehouse connection first · supports dbt Cloud and dbt Core</div>
  </div>
);

// ── Importing ────────────────────────────────────────────────────────────────

const ImportingState: React.FC = () => (
  <div style={{ padding: `${sp.J}px ${sp.H}px`, maxWidth: 640, margin: '0 auto' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: sp.C, marginBottom: sp.E }}>
      <DbtLogo />
      <div>
        <div style={{ fontSize: 18, fontWeight: fw.semibold, color: c['content-primary'] }}>Importing dbt project · analytics</div>
        <div style={{ fontSize: fs.xs, color: c['content-tertiary'] }}>From dbt Cloud · linked to snowflake-prod</div>
      </div>
    </div>

    <Card style={{ padding: sp.E }}>
      {[
        { label: 'Reading manifest.json',     status: 'done' },
        { label: 'Resolving warehouse views', status: 'done' },
        { label: 'Translating 18 models to draft TS Models', status: 'in-progress' },
        { label: 'Running validation pass (chasm traps, joins, descriptions)', status: 'pending' },
      ].map((s, i) => (
        <div key={s.label} style={{
          display: 'flex', alignItems: 'center', gap: sp.C,
          padding: `${sp.B + 2}px 0`,
          borderBottom: i < 3 ? `1px solid ${c['background-subtle']}` : 'none',
        }}>
          <span style={{
            width: 16, height: 16, borderRadius: 8,
            backgroundColor: s.status === 'done' ? c['content-success'] : s.status === 'in-progress' ? c['content-brand'] : c['background-subtle'],
            color: 'white', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>{s.status === 'done' ? '✓' : s.status === 'in-progress' ? '↻' : ''}</span>
          <span style={{ fontSize: fs.sm, color: s.status === 'pending' ? c['content-tertiary'] : c['content-primary'] }}>{s.label}</span>
        </div>
      ))}
    </Card>
  </div>
);

// ── Imported — review surface ────────────────────────────────────────────────

const ImportedState: React.FC = () => (
  <div style={{ padding: `${sp.G}px ${sp.H}px`, maxWidth: 1080, margin: '0 auto' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: sp.C, marginBottom: sp.B }}>
      <DbtLogo />
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: fw.semibold, color: c['content-primary'] }}>analytics imported</h1>
      <Pill tone="info">18 draft models</Pill>
    </div>
    <p style={{ marginTop: 0, marginBottom: sp.E, fontSize: fs.sm, color: c['content-secondary'] }}>
      Your dbt models are now drafts. Review the issues we caught, then publish to make them available to your team.
    </p>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: sp.C, marginBottom: sp.E }}>
      {[
        { k: 'Models',    v: '18',    tone: 'neutral' as const },
        { k: 'Blocking',  v: '1',     tone: 'error' as const,   sub: '1 broken reference' },
        { k: 'Advisory',  v: '14',    tone: 'warn' as const,    sub: 'chasm traps, missing synonyms…' },
        { k: 'Ready',     v: '3',     tone: 'good' as const,    sub: 'all checks pass' },
      ].map(s => (
        <Card key={s.k} style={{ padding: sp.D }}>
          <div style={{ fontSize: fs.xs, color: c['content-tertiary'] }}>{s.k}</div>
          <div style={{ fontSize: 22, fontWeight: fw.semibold, color: c['content-primary'], marginTop: 2 }}>{s.v}</div>
          {s.sub && <div style={{ fontSize: fs.xs, color: c['content-secondary'], marginTop: 2 }}>{s.sub}</div>}
        </Card>
      ))}
    </div>

    <Card style={{ overflow: 'hidden' }}>
      <div style={{ padding: `${sp.B}px ${sp.D}px`, backgroundColor: c['background-subtle'], borderBottom: `1px solid ${c['border-divider']}`, fontSize: 11, fontWeight: fw.medium, color: c['content-secondary'], textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Imported models
      </div>
      {[
        { name: 'fct_revenue',       issues: { block: 0, adv: 2 }, status: 'advisory' },
        { name: 'fct_orders',        issues: { block: 1, adv: 0 }, status: 'blocking', err: 'broken ref: customers.email' },
        { name: 'dim_customers',     issues: { block: 0, adv: 0 }, status: 'ready' },
        { name: 'dim_campaigns',     issues: { block: 0, adv: 1 }, status: 'advisory' },
        { name: 'fct_marketing_perf', issues: { block: 0, adv: 3 }, status: 'advisory' },
      ].map((m, i) => (
        <div key={m.name} style={{
          display: 'grid', gridTemplateColumns: '24px 2fr 2fr 1fr 80px', gap: sp.C,
          padding: `${sp.B + 1}px ${sp.D}px`, alignItems: 'center',
          borderTop: i > 0 ? `1px solid ${c['border-divider']}` : 'none', fontSize: fs.sm,
        }}>
          <span style={{ color: c['content-tertiary'] }}>◆</span>
          <code style={{ fontFamily: ff.mono, color: c['content-brand'] }}>{m.name}</code>
          <div>
            {m.status === 'ready'    && <Pill tone="good">● All checks pass</Pill>}
            {m.status === 'advisory' && <Pill tone="warn">▲ {m.issues.adv} advisory</Pill>}
            {m.status === 'blocking' && <Pill tone="error">● {m.err}</Pill>}
          </div>
          <div style={{ color: c['content-tertiary'], fontSize: fs.xs }}>{m.issues.block} blocking · {m.issues.adv} advisory</div>
          <button style={{ padding: `${sp.A}px ${sp.B}px`, borderRadius: 4, border: `1px solid ${c['border-default']}`, backgroundColor: c['background-base'], color: c['content-primary'], fontSize: fs.xs, fontFamily: ff.primary, cursor: 'pointer' }}>Review →</button>
        </div>
      ))}
    </Card>

    <div style={{ marginTop: sp.E, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: sp.B }}>
      <div style={{ fontSize: fs.xs, color: c['content-tertiary'] }}>
        Resolve the 1 blocking issue to publish, or override with acknowledgment.
      </div>
      <div style={{ display: 'flex', gap: sp.B }}>
        <GhostButton size="sm">Save all as drafts</GhostButton>
        <PrimaryButton size="sm">Review issues</PrimaryButton>
      </div>
    </div>
  </div>
);

// ── Issues review surface ────────────────────────────────────────────────────

const IssuesState: React.FC = () => (
  <div style={{ padding: `${sp.G}px ${sp.H}px`, maxWidth: 920, margin: '0 auto' }}>
    <div style={{ fontSize: fs.xs, color: c['content-tertiary'], marginBottom: sp.A }}>analytics › <strong>fct_marketing_perf</strong></div>
    <div style={{ display: 'flex', alignItems: 'center', gap: sp.C, marginBottom: sp.E }}>
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: fw.semibold, color: c['content-primary'], fontFamily: ff.mono }}>fct_marketing_perf</h1>
      <Pill tone="warn">▲ 3 advisory</Pill>
    </div>

    {/* Blocking section header */}
    <div style={{ fontSize: 11, color: c['content-secondary'], textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: fw.semibold, marginBottom: sp.B }}>
      Blocking <span style={{ color: c['content-tertiary'] }}>· must resolve to publish</span>
    </div>
    <Card style={{ padding: sp.D, marginBottom: sp.E, fontSize: fs.sm, color: c['content-tertiary'] }}>
      No blocking issues for this model.
    </Card>

    {/* Advisory section */}
    <div style={{ fontSize: 11, color: c['content-secondary'], textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: fw.semibold, marginBottom: sp.B }}>
      Advisory <span style={{ color: c['content-tertiary'] }}>· publish anyway, fix later</span>
    </div>
    {[
      {
        title: 'Chasm trap on transactions ↔ order_items ↔ returns',
        body: 'Joining transactions to both order_items and returns via order_id will inflate SUM(revenue). Each revenue row is duplicated for every matching return.',
        type: 'Correctness',
        fix: 'Pre-aggregate returns before joining',
      },
      {
        title: 'Spotter readiness — missing synonym',
        body: 'Spotter wouldn\'t answer "top customers by spend" correctly. The column lifetime_value has no synonym.',
        type: 'Spotter readiness',
        fix: 'Add synonyms: "spend", "customer value", "LTV"',
      },
      {
        title: 'Missing column descriptions',
        body: '6 of 14 columns have no description. AI agents can\'t interpret them confidently.',
        type: 'Context',
        fix: 'Generate descriptions from dbt schema.yml + column patterns',
      },
    ].map(iss => (
      <Card key={iss.title} style={{ padding: sp.D, marginBottom: sp.B }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: sp.C }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, marginBottom: sp.A }}>
              <span style={{ fontSize: 14 }}>▲</span>
              <span style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'] }}>{iss.title}</span>
              <Pill tone="warn">{iss.type}</Pill>
            </div>
            <div style={{ fontSize: fs.xs, color: c['content-secondary'], lineHeight: 1.5, marginBottom: sp.B, marginLeft: 22 }}>{iss.body}</div>
            <div style={{ marginLeft: 22, padding: sp.B, borderRadius: 4, backgroundColor: c['background-information'], display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
                <span style={{ fontSize: 12 }}>✦</span>
                <span style={{ fontSize: fs.xs, color: c['content-brand'], fontWeight: fw.medium }}>AI fix: {iss.fix}</span>
              </div>
              <div style={{ display: 'flex', gap: sp.A }}>
                <button style={{ padding: `2px ${sp.B}px`, fontSize: fs.xs, border: `1px solid ${c['content-brand']}`, borderRadius: 4, backgroundColor: c['background-base'], color: c['content-brand'], cursor: 'pointer', fontFamily: ff.primary }}>Apply</button>
                <button style={{ padding: `2px ${sp.B}px`, fontSize: fs.xs, border: 'none', backgroundColor: 'transparent', color: c['content-tertiary'], cursor: 'pointer', fontFamily: ff.primary }}>Dismiss</button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    ))}

    <div style={{ marginTop: sp.E, display: 'flex', justifyContent: 'flex-end', gap: sp.B }}>
      <GhostButton size="sm">Keep as draft</GhostButton>
      <PrimaryButton size="sm">Publish · 3 advisories will remain</PrimaryButton>
    </div>
  </div>
);

// ── AI fix in action ─────────────────────────────────────────────────────────

const FixFlowState: React.FC = () => (
  <div style={{ padding: `${sp.G}px ${sp.H}px`, maxWidth: 920, margin: '0 auto' }}>
    <div style={{ fontSize: fs.xs, color: c['content-tertiary'], marginBottom: sp.A }}>fct_marketing_perf › Fix chasm trap</div>
    <h1 style={{ margin: 0, marginBottom: sp.E, fontSize: 20, fontWeight: fw.semibold, color: c['content-primary'] }}>AI fix · Pre-aggregate returns before join</h1>

    <Card style={{ padding: sp.D, marginBottom: sp.D }}>
      <div style={{ fontSize: fs.sm, fontWeight: fw.semibold, marginBottom: sp.B, color: c['content-primary'] }}>The problem</div>
      <div style={{ fontSize: fs.xs, color: c['content-secondary'], lineHeight: 1.5 }}>
        Your join graph: <code style={{ fontFamily: ff.mono, color: c['content-brand'] }}>transactions ←(order_id)→ order_items</code> AND <code style={{ fontFamily: ff.mono, color: c['content-brand'] }}>transactions ←(order_id)→ returns</code>. When a transaction has both line items and returns, SUM(transactions.revenue) gets multiplied. Spotter answers like "total revenue by region" will be inflated.
      </div>
    </Card>

    <Card style={{ padding: sp.D, marginBottom: sp.D }}>
      <div style={{ fontSize: fs.sm, fontWeight: fw.semibold, marginBottom: sp.C, color: c['content-primary'] }}>Proposed fix</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp.C, fontFamily: ff.mono, fontSize: fs.xs }}>
        <div style={{ padding: sp.C, backgroundColor: c['background-subtle'], borderRadius: 4 }}>
          <div style={{ fontSize: 10, color: c['content-tertiary'], textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: sp.A, fontFamily: ff.primary, fontWeight: fw.medium }}>Before</div>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: c['content-secondary'] }}>{`transactions
  ⨝ order_items ON order_id
  ⨝ returns     ON order_id
-- chasm trap`}</pre>
        </div>
        <div style={{ padding: sp.C, backgroundColor: c['background-success'], borderRadius: 4 }}>
          <div style={{ fontSize: 10, color: c['content-tertiary'], textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: sp.A, fontFamily: ff.primary, fontWeight: fw.medium }}>After</div>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: c['content-success'] }}>{`transactions
  ⨝ order_items ON order_id
  ⨝ (returns_agg) ON order_id
   where returns_agg
     pre-summed by order_id`}</pre>
        </div>
      </div>
    </Card>

    <Card style={{ padding: sp.D, marginBottom: sp.E }}>
      <div style={{ fontSize: fs.sm, fontWeight: fw.semibold, marginBottom: sp.B, color: c['content-primary'] }}>What this changes</div>
      <ul style={{ margin: 0, paddingLeft: sp.D, fontSize: fs.xs, color: c['content-secondary'], lineHeight: 1.7 }}>
        <li>Adds a CTE <code style={{ fontFamily: ff.mono }}>returns_agg</code> that sums returns per order_id</li>
        <li>Replaces the direct returns join with the aggregated one</li>
        <li>SUM(transactions.revenue) - SUM(returns_agg.amount) = correct net revenue</li>
        <li>Will ask: "Promote this fix back to your dbt project?" after apply</li>
      </ul>
    </Card>

    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: sp.B }}>
      <GhostButton size="sm">Reject</GhostButton>
      <GhostButton size="sm">Edit fix</GhostButton>
      <PrimaryButton size="sm">Apply fix</PrimaryButton>
    </div>
  </div>
);

// ── Published state ──────────────────────────────────────────────────────────

const PublishedState: React.FC = () => (
  <div style={{ padding: `${sp.J}px ${sp.H}px`, maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
    <div style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: c['background-success'], display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', color: c['content-success'], fontSize: 28 }}>✓</div>
    <h1 style={{ margin: 0, marginTop: sp.D, fontSize: 22, fontWeight: fw.semibold, color: c['content-primary'] }}>18 models live</h1>
    <p style={{ marginTop: sp.B, marginBottom: sp.G, fontSize: fs.sm, color: c['content-secondary'] }}>
      Your team can now query them in Spotter. 14 advisory items remain — you can fix them anytime.
    </p>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: sp.C, textAlign: 'left' as const, marginBottom: sp.G }}>
      {[
        ['Live link', 'Auto-pulls dbt changes'],
        ['On-demand sync', 'Refresh anytime from Models'],
        ['Push-back', 'Promote your overrides back to dbt'],
      ].map(([t, d]) => (
        <Card key={t} style={{ padding: sp.C }}>
          <div style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'] }}>{t}</div>
          <div style={{ fontSize: fs.xs, color: c['content-secondary'], marginTop: 2 }}>{d}</div>
        </Card>
      ))}
    </div>

    <div style={{ display: 'flex', gap: sp.B, justifyContent: 'center' }}>
      <GhostButton size="sm">View advisory issues</GhostButton>
      <PrimaryButton size="sm">Open in Models →</PrimaryButton>
    </div>
  </div>
);

// ── Top-level component ──────────────────────────────────────────────────────

export const DbtExploration: React.FC = () => {
  const [state, setState] = useState<SubState>('empty');
  return (
    <ExplorationFrame
      title="dbt — explorations"
      subtabs={SUBTABS}
      active={state}
      onChange={(id) => setState(id as SubState)}
    >
      {state === 'empty'     && <EmptyState />}
      {state === 'importing' && <ImportingState />}
      {state === 'imported'  && <ImportedState />}
      {state === 'issues'    && <IssuesState />}
      {state === 'fix-flow'  && <FixFlowState />}
      {state === 'published' && <PublishedState />}
    </ExplorationFrame>
  );
};
