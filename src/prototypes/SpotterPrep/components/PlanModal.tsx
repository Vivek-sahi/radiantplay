import React, { useState } from 'react';
import { c, sp, fs, fw, ff } from '../styles';
import { ISSUE_META, IssueType } from '../data/mockData';

interface PlanIssue {
  id: string;
  columnName: string;
  table: string;
  issueType: IssueType;
  affectedRows: number;
  replaceWith: string;
  reason: string;
}

const PLAN_ISSUES: PlanIssue[] = [
  { id: 'p001', columnName: 'billing_entry_aws',  table: 'billing_accounts', issueType: 'nulls',        affectedRows: 14203, replaceWith: '""',                    reason: 'Null entry IDs prevent deduplication and inflate blended_cost averages by ~3.7×' },
  { id: 'p002', columnName: 'reservation_arn',    table: 'billing_accounts', issueType: 'nulls',        affectedRows: 41876, replaceWith: '"(none)"',               reason: 'Non-reserved EC2 instances have no ARN — null breaks downstream reservation utilization answers' },
  { id: 'p003', columnName: 'account_name',       table: 'billing_accounts', issueType: 'blanks',       affectedRows: 2847,  replaceWith: '"NULL"',                 reason: 'Blank strings display as empty cells in liveboards; "NULL" label makes them identifiable' },
  { id: 'p004', columnName: 'operation',          table: 'billing_accounts', issueType: 'nulls',        affectedRows: 8234,  replaceWith: '"Unknown"',              reason: 'Null operations cause rows to be excluded from operation-level cost breakdowns' },
  { id: 'p005', columnName: 'billing_period_aws', table: 'billing_accounts', issueType: 'type_mismatch',affectedRows: 156,   replaceWith: 'YYYY-MM-DD',            reason: '12 date formats detected — normalize to ISO 8601 for reliable time-series queries' },
  { id: 'p006', columnName: 'line_item_type',     table: 'billing_accounts', issueType: 'type_mismatch',affectedRows: 407,   replaceWith: '"Usage"',               reason: 'Numeric values stored in string field — cast to canonical enum values' },
  { id: 'p007', columnName: 'blended_cost',       table: 'billing_accounts', issueType: 'anomaly',      affectedRows: 23,    replaceWith: 'flag + null',            reason: 'Values >$20K are 37× above average — flag for review, null out to prevent avg inflation' },
  { id: 'p008', columnName: 'product_code',       table: 'billing_accounts', issueType: 'duplicates',   affectedRows: 312,   replaceWith: 'deduplicate',           reason: 'Duplicate entries per billing period — keep first occurrence, remove duplicates' },
  { id: 'p009', columnName: 'resource_id',        table: 'line_items',       issueType: 'blanks',       affectedRows: 1122,  replaceWith: '"(none)"',               reason: 'Serverless and managed service charges have no resource ID — blank breaks GROUP BY queries' },
  { id: 'p010', columnName: 'usage_type',         table: 'line_items',       issueType: 'nulls',        affectedRows: 2790,  replaceWith: '"Untagged"',             reason: 'Null usage types exclude rows from usage analysis; "Untagged" preserves row counts' },
  { id: 'p011', columnName: 'cost_category',      table: 'line_items',       issueType: 'nulls',        affectedRows: 6421,  replaceWith: '"Uncategorized"',        reason: 'Null cost categories exclude rows from cost allocation reports' },
  { id: 'p012', columnName: 'service_name',       table: 'line_items',       issueType: 'blanks',       affectedRows: 891,   replaceWith: '"(unknown)"',            reason: 'Blank service names break service-level cost breakdowns in liveboards' },
  { id: 'p013', columnName: 'currency_code',      table: 'billing_accounts', issueType: 'type_mismatch',affectedRows: 44,    replaceWith: '"USD"',                  reason: 'Legacy rows stored as numeric code 840 (USD) — normalize to ISO 4217 string' },
  { id: 'p014', columnName: 'exchange_rate',      table: 'billing_accounts', issueType: 'nulls',        affectedRows: 3102,  replaceWith: '1.0',                    reason: 'USD-denominated entries have no exchange rate — default to 1.0 for currency conversion formulas' },
  { id: 'p015', columnName: 'cost_center',        table: 'subscriptions',    issueType: 'nulls',        affectedRows: 5677,  replaceWith: '"Unassigned"',           reason: 'Unassigned cost centers cause rows to be excluded from showback/chargeback reports' },
  { id: 'p016', columnName: 'department_code',    table: 'subscriptions',    issueType: 'blanks',       affectedRows: 2233,  replaceWith: '"DEPT-000"',             reason: 'Empty department codes break department-level budget vs actual comparisons' },
  { id: 'p017', columnName: 'project_id',         table: 'subscriptions',    issueType: 'nulls',        affectedRows: 4891,  replaceWith: '"untagged"',             reason: 'Null project IDs exclude rows from project cost tracking — "untagged" makes them visible' },
  { id: 'p018', columnName: 'owner_email',        table: 'subscriptions',    issueType: 'nulls',        affectedRows: 1567,  replaceWith: '"unknown@company.com"',  reason: 'Null owner emails prevent cost ownership assignment in FinOps workflows' },
  { id: 'p019', columnName: 'environment',        table: 'subscriptions',    issueType: 'blanks',       affectedRows: 3344,  replaceWith: '"production"',           reason: 'Blank environment tags default to production assumption per tagging policy' },
  { id: 'p020', columnName: 'linked_account_id',  table: 'billing_accounts', issueType: 'type_mismatch',affectedRows: 78,    replaceWith: 'zero-pad to 12',        reason: 'Some IDs missing leading zeros — normalize to 12-digit format to match AWS console' },
  { id: 'p021', columnName: 'invoice_id',         table: 'billing_accounts', issueType: 'duplicates',   affectedRows: 189,   replaceWith: 'deduplicate',           reason: 'Same invoice ID appears on multiple rows — retain first, remove subsequent duplicates' },
  { id: 'p022', columnName: 'charge_type',        table: 'line_items',       issueType: 'type_mismatch',affectedRows: 213,   replaceWith: '"Usage"',               reason: 'Numeric charge codes mixed with string labels — normalize to canonical string values' },
  { id: 'p023', columnName: 'amortized_cost',     table: 'line_items',       issueType: 'nulls',        affectedRows: 7823,  replaceWith: 'blended_cost',          reason: 'Amortized cost null for on-demand usage — populate from blended_cost for these rows' },
  { id: 'p024', columnName: 'tag_key',            table: 'line_items',       issueType: 'blanks',       affectedRows: 4112,  replaceWith: '"untagged"',             reason: 'Untagged resources lack key — required for cost allocation by tag value' },
  { id: 'p025', columnName: 'tag_value',          table: 'line_items',       issueType: 'blanks',       affectedRows: 5890,  replaceWith: '"(none)"',               reason: 'Tags without values break tag-based filtering in liveboards' },
  { id: 'p026', columnName: 'region',             table: 'billing_accounts', issueType: 'nulls',        affectedRows: 2345,  replaceWith: '"us-east-1"',            reason: 'Global services (IAM, Route53) have no region — default to us-east-1 per AWS billing convention' },
  { id: 'p027', columnName: 'availability_zone',  table: 'billing_accounts', issueType: 'nulls',        affectedRows: 18923, replaceWith: '"(none)"',               reason: 'Regional services have no AZ — null breaks AZ-level availability reports' },
  { id: 'p028', columnName: 'instance_type',      table: 'billing_accounts', issueType: 'blanks',       affectedRows: 677,   replaceWith: '"unspecified"',          reason: 'Managed services have no instance type — blank breaks instance family cost queries' },
  { id: 'p029', columnName: 'tenancy',            table: 'billing_accounts', issueType: 'nulls',        affectedRows: 9012,  replaceWith: '"default"',              reason: 'Shared tenancy is default — null causes rows to be excluded from tenancy-based cost splits' },
  { id: 'p030', columnName: 'purchase_option',    table: 'billing_accounts', issueType: 'nulls',        affectedRows: 3456,  replaceWith: '"on-demand"',            reason: 'Non-reserved purchases have no option type — "on-demand" preserves correct cost grouping' },
  { id: 'p031', columnName: 'savings_plan_arn',   table: 'billing_accounts', issueType: 'nulls',        affectedRows: 52341, replaceWith: '"(none)"',               reason: 'Non-savings-plan charges have no ARN — null breaks savings plan coverage analysis' },
  { id: 'p032', columnName: 'pricing_unit',       table: 'line_items',       issueType: 'blanks',       affectedRows: 445,   replaceWith: '"Hrs"',                  reason: 'Blank pricing unit defaults to hourly per EC2 pricing convention' },
  { id: 'p033', columnName: 'usage_amount',       table: 'line_items',       issueType: 'anomaly',      affectedRows: 8,     replaceWith: 'flag + null',            reason: 'Usage amounts >1M Hrs indicate data pipeline errors — flag and null for manual review' },
  { id: 'p034', columnName: 'subscription_id',    table: 'subscriptions',    issueType: 'duplicates',   affectedRows: 67,    replaceWith: 'deduplicate',           reason: 'Duplicate subscription IDs cause double-counting in subscription cost rollups' },
  { id: 'p035', columnName: 'contract_start',     table: 'subscriptions',    issueType: 'type_mismatch',affectedRows: 34,    replaceWith: 'YYYY-MM-DD',            reason: 'Mixed epoch timestamps and ISO strings — normalize to ISO 8601' },
  { id: 'p036', columnName: 'contract_end',       table: 'subscriptions',    issueType: 'type_mismatch',affectedRows: 29,    replaceWith: 'YYYY-MM-DD',            reason: 'Mixed epoch timestamps and ISO strings — normalize to ISO 8601' },
  { id: 'p037', columnName: 'renewal_flag',       table: 'subscriptions',    issueType: 'type_mismatch',affectedRows: 156,   replaceWith: 'true/false',            reason: 'Mixed "Y/N" and boolean values — normalize to boolean for filter consistency' },
  { id: 'p038', columnName: 'auto_renew',         table: 'subscriptions',    issueType: 'nulls',        affectedRows: 2341,  replaceWith: 'false',                  reason: 'Null auto-renew defaults to false per contract management policy' },
  { id: 'p039', columnName: 'billing_frequency',  table: 'subscriptions',    issueType: 'blanks',       affectedRows: 789,   replaceWith: '"monthly"',              reason: 'Blank billing frequency defaults to monthly per standard contract terms' },
  { id: 'p040', columnName: 'discount_rate',      table: 'subscriptions',    issueType: 'nulls',        affectedRows: 4567,  replaceWith: '0.0',                    reason: 'Null discount rates break net cost calculations — default to 0 (no discount)' },
  { id: 'p041', columnName: 'tax_rate',           table: 'billing_accounts', issueType: 'nulls',        affectedRows: 6789,  replaceWith: '0.0',                    reason: 'Tax-exempt accounts have no rate — null breaks gross-to-net cost formulas' },
  { id: 'p042', columnName: 'marketplace_seller', table: 'line_items',       issueType: 'nulls',        affectedRows: 48123, replaceWith: '"Amazon"',               reason: 'First-party AWS services have no seller — default to "Amazon" per marketplace billing docs' },
  { id: 'p043', columnName: 'commitment_type',    table: 'billing_accounts', issueType: 'nulls',        affectedRows: 38921, replaceWith: '"none"',                 reason: 'On-demand usage has no commitment type — "none" preserves correct RI/SP coverage metrics' },
  { id: 'p044', columnName: 'net_amortized_cost', table: 'line_items',       issueType: 'nulls',        affectedRows: 12034, replaceWith: 'amortized_cost',        reason: 'Post-discount cost null for standard usage — populate from amortized_cost for these rows' },
  { id: 'p045', columnName: 'effective_cost',     table: 'line_items',       issueType: 'anomaly',      affectedRows: 11,    replaceWith: 'flag + null',            reason: 'Negative effective costs indicate credit misapplication — flag for billing team review' },
  { id: 'p046', columnName: 'cost_type',          table: 'line_items',       issueType: 'duplicates',   affectedRows: 234,   replaceWith: 'deduplicate',           reason: 'Same cost type recorded twice per resource — deduplicate to prevent double-counting' },
  { id: 'p047', columnName: 'data_transfer_type', table: 'line_items',       issueType: 'blanks',       affectedRows: 2156,  replaceWith: '"Internal"',             reason: 'Intra-region transfers have no type label — default to "Internal" per AWS data transfer taxonomy' },
  { id: 'p048', columnName: 'operating_system',   table: 'billing_accounts', issueType: 'nulls',        affectedRows: 23456, replaceWith: '"Linux"',                reason: 'Containers and serverless have no OS — default to Linux per AWS pricing conventions' },
  { id: 'p049', columnName: 'license_model',      table: 'billing_accounts', issueType: 'nulls',        affectedRows: 31234, replaceWith: '"No License"',           reason: 'Open-source services have no license model — "No License" preserves licensing cost splits' },
  { id: 'p050', columnName: 'credits_applied',    table: 'billing_accounts', issueType: 'nulls',        affectedRows: 58901, replaceWith: '0.0',                    reason: 'Accounts with no credits applied show null — default to 0.0 for net cost calculations' },
];

// ── Component ─────────────────────────────────────────────────────────────────

interface PlanModalProps {
  onApply: (selectedIds: Set<string>, fixValues: Record<string, string>) => void;
  onClose: () => void;
  onBackToAgent: () => void;
}

const TABLES      = ['billing_accounts', 'line_items', 'subscriptions'] as const;
const ISSUE_TYPES = ['nulls', 'blanks', 'type_mismatch', 'anomaly', 'duplicates'] as const;

const selectStyle: React.CSSProperties = {
  padding: '5px 10px',
  border: `1px solid`,
  borderRadius: 6,
  fontSize: 12,
  fontFamily: 'inherit',
  cursor: 'pointer',
  appearance: 'none' as const,
  WebkitAppearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236b7280' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 8px center',
  paddingRight: 26,
};

const PlanModal: React.FC<PlanModalProps> = ({ onApply, onClose, onBackToAgent }) => {
  const [selected, setSelected]   = useState<Set<string>>(new Set(PLAN_ISSUES.map(i => i.id)));
  const [fixValues, setFixValues] = useState<Record<string, string>>(
    Object.fromEntries(PLAN_ISSUES.map(i => [i.id, i.replaceWith]))
  );
  const [keyColumns, setKeyColumns] = useState<Set<string>>(new Set());
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [draftValue, setDraftValue] = useState('');
  const [tableFilter,     setTableFilter]     = useState('');
  const [columnFilter,    setColumnFilter]    = useState('');
  const [issueTypeFilter, setIssueTypeFilter] = useState('');

  const filteredIssues = PLAN_ISSUES.filter(i => {
    if (tableFilter     && i.table     !== tableFilter)     return false;
    if (issueTypeFilter && i.issueType !== issueTypeFilter) return false;
    if (columnFilter    && !i.columnName.toLowerCase().includes(columnFilter.toLowerCase())) return false;
    return true;
  });

  const eligibleCount = filteredIssues.filter(i => !keyColumns.has(i.id)).length;
  const selectedCount = selected.size;

  const toggle = (id: string) => {
    if (keyColumns.has(id)) return; // locked key columns can't be toggled
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allChecked = filteredIssues.every(i => keyColumns.has(i.id) || selected.has(i.id));

  const toggleAll = () => {
    if (allChecked) {
      setSelected(prev => {
        const next = new Set(prev);
        filteredIssues.forEach(i => { if (!keyColumns.has(i.id)) next.delete(i.id); });
        return next;
      });
    } else {
      setSelected(prev => {
        const next = new Set(prev);
        filteredIssues.filter(i => !keyColumns.has(i.id)).forEach(i => next.add(i.id));
        return next;
      });
    }
  };

  const toggleKey = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setKeyColumns(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        setSelected(s => { const ns = new Set(s); ns.delete(id); return ns; });
      }
      return next;
    });
  };

  const startEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setDraftValue(fixValues[id] ?? '');
  };

  const commitEdit = (id: string) => {
    const issue = PLAN_ISSUES.find(i => i.id === id);
    setFixValues(prev => ({ ...prev, [id]: draftValue.trim() || (issue?.replaceWith ?? '') }));
    setEditingId(null);
  };

  const thStyle: React.CSSProperties = {
    padding: `${sp.B}px ${sp.D}px`,
    textAlign: 'left', fontSize: fs.sm, fontWeight: fw.medium,
    color: c['content-secondary'],
    borderBottom: `1px solid ${c['border-divider']}`,
    whiteSpace: 'nowrap',
    backgroundColor: c['background-subtle'],
    position: 'sticky', top: 0, zIndex: 1,
  };

  const tdStyle: React.CSSProperties = {
    padding: `${sp.B}px ${sp.D}px`,
    borderBottom: `1px solid ${c['border-divider']}`,
    verticalAlign: 'middle',
    fontSize: fs.sm,
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'rgba(29,35,47,0.6)',
      zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: ff.primary,
    }}>
      <div style={{
        width: 960, maxHeight: '88vh',
        backgroundColor: c['background-base'],
        borderRadius: 12,
        boxShadow: '0 24px 72px rgba(0,0,0,0.24)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          padding: `${sp.E}px ${sp.F}px ${sp.D}px`,
          borderBottom: `1px solid ${c['border-divider']}`,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'] }}>
                Fix plan
              </div>
              <div style={{ fontSize: fs.xs, color: c['content-secondary'], marginTop: 2 }}>
                fnops-final · {PLAN_ISSUES.length} issues identified · {selectedCount} selected
                {keyColumns.size > 0 && (
                  <span style={{ marginLeft: 6, color: '#d97706' }}>· {keyColumns.size} key column{keyColumns.size !== 1 ? 's' : ''} excluded</span>
                )}
              </div>
            </div>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: c['content-secondary'], fontSize: 20, lineHeight: 1, padding: 4,
            }}>×</button>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          padding: `${sp.C}px ${sp.F}px`,
          borderBottom: `1px solid ${c['border-divider']}`,
          display: 'flex', alignItems: 'center', gap: sp.C,
          flexShrink: 0, backgroundColor: c['background-sunken'],
          flexWrap: 'wrap',
        }}>
          <select
            value={tableFilter}
            onChange={e => setTableFilter(e.target.value)}
            style={{ ...selectStyle, borderColor: tableFilter ? c['content-brand'] : c['border-default'], color: tableFilter ? c['content-brand'] : c['content-secondary'], backgroundColor: tableFilter ? '#eff6ff' : c['background-base'] }}
          >
            <option value="">All tables</option>
            {TABLES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input
            value={columnFilter}
            onChange={e => setColumnFilter(e.target.value)}
            placeholder="Filter by column…"
            style={{
              padding: '5px 10px', borderRadius: 6,
              border: `1px solid ${columnFilter ? c['content-brand'] : c['border-default']}`,
              fontSize: 12, fontFamily: 'inherit',
              backgroundColor: columnFilter ? '#eff6ff' : c['background-base'],
              color: columnFilter ? c['content-brand'] : c['content-primary'],
              outline: 'none', width: 160,
            }}
          />
          <select
            value={issueTypeFilter}
            onChange={e => setIssueTypeFilter(e.target.value)}
            style={{ ...selectStyle, borderColor: issueTypeFilter ? c['content-brand'] : c['border-default'], color: issueTypeFilter ? c['content-brand'] : c['content-secondary'], backgroundColor: issueTypeFilter ? '#eff6ff' : c['background-base'] }}
          >
            <option value="">All issue types</option>
            {ISSUE_TYPES.map(t => <option key={t} value={t}>{ISSUE_META[t]?.label ?? t}</option>)}
          </select>
          {(tableFilter || columnFilter || issueTypeFilter) && (
            <button
              onClick={() => { setTableFilter(''); setColumnFilter(''); setIssueTypeFilter(''); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: fs.xs, color: c['content-brand'], fontFamily: 'inherit', padding: 0 }}
            >
              Clear filters
            </button>
          )}
          <span style={{ marginLeft: 'auto', fontSize: fs.xs, color: c['content-tertiary'] }}>
            {filteredIssues.length} of {PLAN_ISSUES.length} shown
          </span>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: fs.sm }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: 40 }}>
                  <input
                    type="checkbox" checked={allChecked} onChange={toggleAll}
                    style={{ cursor: 'pointer', accentColor: c['content-brand'] }}
                  />
                </th>
                <th style={{ ...thStyle, width: 36 }} title="Exclude key column from fixes">Key</th>
                <th style={{ ...thStyle, minWidth: 220 }}>Issue</th>
                <th style={{ ...thStyle, minWidth: 180 }}>Replace with</th>
                <th style={{ ...thStyle, minWidth: 280 }}>Reason</th>
              </tr>
            </thead>
            <tbody>
              {filteredIssues.map((issue, i) => {
                const meta      = ISSUE_META[issue.issueType];
                const isChecked = selected.has(issue.id);
                const isKey     = keyColumns.has(issue.id);
                const isEditing = editingId === issue.id;
                const fixVal    = fixValues[issue.id] ?? issue.replaceWith;
                const isCustom  = fixVal !== issue.replaceWith;

                return (
                  <tr
                    key={issue.id}
                    onClick={() => toggle(issue.id)}
                    style={{
                      backgroundColor: isKey
                        ? '#fffbeb'
                        : isChecked
                        ? '#eff6ff'
                        : i % 2 === 0 ? c['background-base'] : c['background-sunken'],
                      cursor: isKey ? 'default' : 'pointer',
                      opacity: isKey ? 0.6 : 1,
                    }}
                  >
                    {/* Checkbox */}
                    <td style={{ ...tdStyle, width: 40 }} onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isChecked && !isKey}
                        disabled={isKey}
                        onChange={() => toggle(issue.id)}
                        style={{ cursor: isKey ? 'not-allowed' : 'pointer', accentColor: c['content-brand'] }}
                      />
                    </td>

                    {/* Key column toggle */}
                    <td style={{ ...tdStyle, width: 36, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={e => toggleKey(issue.id, e)}
                        title={isKey ? 'Key column — click to unmark' : 'Mark as key column to exclude from fixes'}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: 13, padding: 2, lineHeight: 1,
                          color: isKey ? '#d97706' : c['content-tertiary'],
                          opacity: isKey ? 1 : 0.4,
                        }}
                      >
                        {isKey ? '⊗' : '⊙'}
                      </button>
                    </td>

                    {/* Issue — column name + table + type badge + row count */}
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: fw.medium, color: c['content-primary'], fontFamily: 'monospace', fontSize: fs.sm }}>
                          {issue.columnName}
                        </span>
                        <span style={{
                          fontSize: 10, fontWeight: fw.medium,
                          color: meta.color, backgroundColor: meta.bg,
                          borderRadius: 3, padding: '1px 5px', flexShrink: 0,
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                        }}>
                          {meta.icon} {meta.label}
                        </span>
                      </div>
                      <div style={{ fontSize: 10, color: c['content-tertiary'], marginTop: 2 }}>
                        {issue.table} · {issue.affectedRows.toLocaleString()} rows
                      </div>
                    </td>

                    {/* Replace with — editable */}
                    <td style={tdStyle} onClick={e => e.stopPropagation()}>
                      {isEditing ? (
                        <input
                          autoFocus
                          value={draftValue}
                          onChange={e => setDraftValue(e.target.value)}
                          onBlur={() => commitEdit(issue.id)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') commitEdit(issue.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          style={{
                            width: '100%', padding: '3px 6px',
                            border: `1px solid ${c['border-brand']}`,
                            borderRadius: 4, fontSize: fs.sm,
                            fontFamily: 'monospace', outline: 'none',
                            backgroundColor: c['background-base'],
                            color: c['content-primary'],
                          }}
                        />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: sp.A }}>
                          <code style={{
                            fontSize: 12, fontFamily: 'monospace',
                            color: isCustom ? c['content-brand'] : c['content-primary'],
                            backgroundColor: isCustom ? '#dbeafe' : c['background-subtle'],
                            borderRadius: 3, padding: '2px 6px',
                            maxWidth: 160, overflow: 'hidden',
                            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            display: 'block',
                          }}>
                            {fixVal}
                          </code>
                          <button
                            onClick={e => startEdit(issue.id, e)}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: c['content-tertiary'], fontSize: fs.sm, padding: 2, lineHeight: 1,
                              flexShrink: 0,
                            }}
                            title="Edit"
                          >✎</button>
                        </div>
                      )}
                    </td>

                    {/* Reason */}
                    <td style={{ ...tdStyle, color: c['content-secondary'], lineHeight: 1.45, fontSize: 12 }}>
                      {issue.reason}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{
          padding: `${sp.C}px ${sp.F}px`,
          borderTop: `1px solid ${c['border-divider']}`,
          display: 'flex', alignItems: 'center', gap: sp.C,
          flexShrink: 0,
          backgroundColor: c['background-sunken'],
        }}>
          <button
            onClick={onBackToAgent}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: c['content-brand'], fontSize: fs.xs,
              fontFamily: ff.primary, padding: 0,
              display: 'flex', alignItems: 'center', gap: sp.A,
            }}
          >
            ← Back to conversation
          </button>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: fs.xs, color: c['content-secondary'] }}>
            {selectedCount} of {eligibleCount} fixes selected
          </div>
          <button
            onClick={onClose}
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
            onClick={() => onApply(selected, fixValues)}
            disabled={selectedCount === 0}
            style={{
              padding: `${sp.B}px ${sp.E}px`,
              border: 'none', borderRadius: 6,
              backgroundColor: selectedCount === 0 ? c['background-subtle'] : c['background-brand'],
              color: selectedCount === 0 ? c['content-tertiary'] : '#fff',
              fontSize: fs.sm, fontWeight: fw.medium,
              cursor: selectedCount === 0 ? 'not-allowed' : 'pointer',
              fontFamily: ff.primary,
            }}
          >
            Apply all
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanModal;
