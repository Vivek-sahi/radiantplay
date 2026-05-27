import React, { useState, useRef, useEffect } from 'react';
import { systemColors, referenceColors } from '../../tokens/colors';
import { ConfirmDialog } from './ConfirmDialog';

const font = '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const brand = systemColors.light['content-brand'];

// ─── Toggle ───────────────────────────────────────────────────────────────────

const Toggle: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
  <button
    onClick={onChange} role="switch" aria-checked={checked}
    style={{
      position: 'relative', width: '36px', height: '20px', borderRadius: '10px',
      border: 'none', backgroundColor: checked ? brand : referenceColors.gray['30'],
      cursor: 'pointer', padding: 0, flexShrink: 0, transition: 'background-color 0.2s ease',
    }}
  >
    <span style={{
      position: 'absolute', top: '2px',
      left: checked ? '18px' : '2px',
      width: '16px', height: '16px', borderRadius: '50%',
      backgroundColor: '#fff', transition: 'left 0.2s ease',
      boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
    }} />
  </button>
);

// ─── Dropdown ────────────────────────────────────────────────────────────────

const Dropdown: React.FC<{ value: string; options: string[]; width?: number }> = ({
  value: initialValue, options, width = 280,
}) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(initialValue);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width });
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleToggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    setOpen(!open);
  };

  return (
    <div ref={ref} style={{ position: 'relative', width, flexShrink: 0 }}>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', height: '36px', padding: '0 12px',
          border: `1px solid ${open ? brand : '#D1D5DB'}`, borderRadius: '6px',
          backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: font,
          fontSize: '13px', color: '#111827', outline: 'none', textAlign: 'left',
          boxShadow: open ? `0 0 0 2px ${brand}22` : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{selected}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{ flexShrink: 0, marginLeft: '8px', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }}>
          <path d="M2.5 4.5l3.5 3.5 3.5-3.5" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'fixed', top: menuPos.top, left: menuPos.left, width: menuPos.width,
          backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.10)', zIndex: 9999, overflow: 'hidden',
        }}>
          {options.map((opt) => (
            <button key={opt} onClick={() => { setSelected(opt); setOpen(false); }}
              style={{
                display: 'block', width: '100%', padding: '10px 16px',
                border: 'none', textAlign: 'left', fontFamily: font, fontSize: '13px',
                fontWeight: opt === selected ? 500 : 400,
                color: opt === selected ? brand : '#111827',
                backgroundColor: opt === selected ? `${brand}10` : 'transparent',
                cursor: 'pointer', transition: 'background-color 0.1s',
              }}
              onMouseEnter={(e) => { if (opt !== selected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F9FAFB'; }}
              onMouseLeave={(e) => { if (opt !== selected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── SettingRow ───────────────────────────────────────────────────────────────

const SettingRow: React.FC<{
  label: string;
  description?: string;
  control: React.ReactNode;
}> = ({ label, description, control }) => (
  <div style={{
    display: 'flex', alignItems: description ? 'flex-start' : 'center',
    justifyContent: 'space-between', gap: '32px', padding: '18px 24px',
    backgroundColor: '#FFFFFF', border: '1px solid #E9EAEC', borderRadius: '8px',
  }}>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827', fontFamily: font, lineHeight: 1.4 }}>
        {label}
      </div>
      {description && (
        <div style={{ fontSize: '12.5px', color: '#9CA3AF', fontFamily: font, marginTop: '3px', lineHeight: 1.5 }}>
          {description}
        </div>
      )}
    </div>
    <div style={{ flexShrink: 0, paddingTop: description ? '2px' : '0' }}>
      {control}
    </div>
  </div>
);

// ─── ResetLink ────────────────────────────────────────────────────────────────

const ResetLink: React.FC<{ onClick?: () => void }> = ({ onClick }) => (
  <button onClick={onClick} style={{
    border: 'none', background: 'none', cursor: 'pointer',
    fontSize: '13px', fontWeight: 500, color: brand, fontFamily: font,
    padding: '0', lineHeight: 1,
  }}>
    Reset
  </button>
);

// ─── Section (collapsible card with subtitle + Reset) ─────────────────────────

const Section: React.FC<{
  title: string;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
  onReset?: () => void;
  children: React.ReactNode;
}> = ({ title, subtitle, open, onToggle, onReset, children }) => {
  const multi = React.Children.count(children) > 1;
  const isOpen = multi ? open : true;
  return (
  <div style={{
    backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB',
    borderRadius: '12px', overflow: 'hidden',
  }}>
    {/* Header row */}
    <div style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', gap: '8px', borderBottom: isOpen ? '1px solid #E5E7EB' : 'none' }}>
      {multi ? (
        <button onClick={onToggle} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          flex: 1, border: 'none', background: 'none', cursor: 'pointer',
          fontFamily: font, textAlign: 'left', padding: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
            style={{ flexShrink: 0, transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.22s ease' }}>
            <path d="M3 5.5l4 4 4-4" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827', fontFamily: font }}>{title}</span>
          {subtitle && <span style={{ fontSize: '12.5px', color: '#9CA3AF', fontFamily: font, fontWeight: 400 }}>{subtitle}</span>}
        </button>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827', fontFamily: font }}>{title}</span>
          {subtitle && <span style={{ fontSize: '12.5px', color: '#9CA3AF', fontFamily: font, fontWeight: 400 }}>{subtitle}</span>}
        </div>
      )}
      <ResetLink onClick={onReset} />
    </div>

    {/* Body */}
    <div style={{
      maxHeight: isOpen ? '3000px' : '0px',
      overflow: 'hidden',
      transition: 'max-height 0.25s ease',
    }}>
      <div style={{ padding: '16px 16px 16px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {children}
      </div>
    </div>
  </div>
  );
};

// ─── SearchSpotIQPageContent ───────────────────────────────────────────────────

export const SearchSpotIQPageContent: React.FC = () => {
  // Section open states
  const [indexOpen, setIndexOpen] = useState(true);
  const [formulaOpen, setFormulaOpen] = useState(true);
  const [queryOpen, setQueryOpen] = useState(true);
  const [spotiqOpen, setSpotiqOpen] = useState(true);

  // Reset dialog
  const [resetSection, setResetSection] = useState<string | null>(null);

  // Index Settings toggles
  const [indexColumns, setIndexColumns] = useState(false);

  // Formula Settings toggles
  const [sqlPassthrough, setSqlPassthrough] = useState(false);
  const [spotterOnLiveboard, setSpotterOnLiveboard] = useState(false);

  // Query Settings toggles
  const [tableSummaries, setTableSummaries] = useState(false);
  const [goButtonRerun, setGoButtonRerun] = useState(false);
  const [nullCheck, setNullCheck] = useState(false);
  const [disableAutoBucket, setDisableAutoBucket] = useState(false);
  const [optimiseCalendar, setOptimiseCalendar] = useState(false);
  const [countIncludeNull, setCountIncludeNull] = useState(false);

  // SpotIQ Settings toggles
  const [spotiqAnalyse, setSpotiqAnalyse] = useState(false);
  const [changeAnalysis, setChangeAnalysis] = useState(false);
  const [kpiAnomalies, setKpiAnomalies] = useState(false);
  const [timeSeriesForecasting, setTimeSeriesForecasting] = useState(false);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>

      {/* ── Sticky header (title only — no tabs) ── */}
      <div style={{
        flexShrink: 0, padding: '28px 40px 20px',
        borderBottom: '1px solid #E5E7EB', backgroundColor: '#FFFFFF',
      }}>
        <h1 style={{
          margin: 0, fontSize: '22px', fontWeight: 700,
          color: '#0F172A', fontFamily: font, letterSpacing: '-0.3px',
        }}>
          Search & SpotIQ
        </h1>
      </div>

      {/* ── Reset confirm dialog ── */}
      {resetSection && (
        <ConfirmDialog
          title="Reset settings"
          message={`This will reset all ${resetSection} to their defaults. Are you sure?`}
          confirmLabel="Reset"
          cancelLabel="Cancel"
          onConfirm={() => setResetSection(null)}
          onCancel={() => setResetSection(null)}
        />
      )}

      {/* ── Scrollable content ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 40px 64px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* ── Index Settings ── */}
            <Section
              title="Index Settings"
              subtitle="Manage search suggestion indexing"
              open={indexOpen}
              onToggle={() => setIndexOpen(!indexOpen)}
              onReset={() => setResetSection('index settings')}
            >
              <SettingRow
                label="Index columns (effective for new tables/columns only)"
                control={<Toggle checked={indexColumns} onChange={() => setIndexColumns(!indexColumns)} />}
              />
              <SettingRow
                label="Indexing Frequency"
                control={
                  <Dropdown
                    value="7 days"
                    options={['8 hours', '16 hours', '24 hours', '7 days']}
                  />
                }
              />
              <SettingRow
                label="Indexing scope"
                control={
                  <Dropdown
                    value="Index only columns used in Models"
                    options={['Index all columns', 'Index only columns used in models']}
                  />
                }
              />
              <SettingRow
                label="Large table indexing control"
                control={
                  <Dropdown
                    value="Index all tables (no limit)"
                    options={[
                      'Index all tables (no limit)',
                      'Disable indexing for tables with ≥ 100M rows',
                      'Disable indexing for tables with ≥ 250M rows',
                      'Disable indexing for tables with ≥ 1B rows',
                    ]}
                  />
                }
              />
            </Section>

            {/* ── Formula Settings ── */}
            <Section
              title="Formula Settings"
              subtitle="Enable or disable formula opt-in features"
              open={formulaOpen}
              onToggle={() => setFormulaOpen(!formulaOpen)}
              onReset={() => setResetSection('formula settings')}
            >
              <SettingRow
                label="SQL Passthrough Functions"
                description="Information in tooltip comes here"
                control={<Toggle checked={sqlPassthrough} onChange={() => setSqlPassthrough(!sqlPassthrough)} />}
              />
              <SettingRow
                label="Spotter on Liveboard"
                description="Information in tooltip comes here"
                control={<Toggle checked={spotterOnLiveboard} onChange={() => setSpotterOnLiveboard(!spotterOnLiveboard)} />}
              />
            </Section>

            {/* ── Query Settings ── */}
            <Section
              title="Query Settings"
              subtitle="Enable or disable SQL query generation rules"
              open={queryOpen}
              onToggle={() => setQueryOpen(!queryOpen)}
              onReset={() => setResetSection('query settings')}
            >
              <SettingRow
                label="Table summaries in ad hoc search (applies only to new answer experience)"
                description="Information in tooltip comes here"
                control={<Toggle checked={tableSummaries} onChange={() => setTableSummaries(!tableSummaries)} />}
              />
              <SettingRow
                label="Search Data, Go button to re-run query"
                description="Information in tooltip comes here"
                control={<Toggle checked={goButtonRerun} onChange={() => setGoButtonRerun(!goButtonRerun)} />}
              />
              <SettingRow
                label="Measure SQL includes null check"
                description="Information in tooltip comes here"
                control={<Toggle checked={nullCheck} onChange={() => setNullCheck(!nullCheck)} />}
              />
              <SettingRow
                label="Default date bucket for date columns"
                control={
                  <Dropdown
                    value="Daily"
                    options={['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly']}
                  />
                }
              />
              <SettingRow
                label="Disable auto-date bucketing"
                description="Description"
                control={<Toggle checked={disableAutoBucket} onChange={() => setDisableAutoBucket(!disableAutoBucket)} />}
              />
              <SettingRow
                label="Optimise custom calendar filters"
                control={<Toggle checked={optimiseCalendar} onChange={() => setOptimiseCalendar(!optimiseCalendar)} />}
              />
              <SettingRow
                label="Whether count/unique count should include null"
                control={<Toggle checked={countIncludeNull} onChange={() => setCountIncludeNull(!countIncludeNull)} />}
              />
            </Section>

            {/* ── SpotIQ Settings ── */}
            <Section
              title="SpotIQ Settings"
              subtitle="SpotIQ helps you find insights and receive alerts about your data."
              open={spotiqOpen}
              onToggle={() => setSpotiqOpen(!spotiqOpen)}
              onReset={() => setResetSection('SpotIQ settings')}
            >
              <SettingRow
                label="SpotIQ Analyse"
                control={<Toggle checked={spotiqAnalyse} onChange={() => setSpotiqAnalyse(!spotiqAnalyse)} />}
              />
              <SettingRow
                label="Change Analysis"
                control={<Toggle checked={changeAnalysis} onChange={() => setChangeAnalysis(!changeAnalysis)} />}
              />
              <SettingRow
                label="KPI Anomalies"
                control={<Toggle checked={kpiAnomalies} onChange={() => setKpiAnomalies(!kpiAnomalies)} />}
              />
              <SettingRow
                label="Shortest time period to check alerts"
                control={
                  <Dropdown
                    value="Every N minutes"
                    options={['Every N minutes', 'Every hour', 'Every 6 hours', 'Every 12 hours', 'Daily']}
                  />
                }
              />
              <SettingRow
                label="Time Series Forecasting"
                control={<Toggle checked={timeSeriesForecasting} onChange={() => setTimeSeriesForecasting(!timeSeriesForecasting)} />}
              />
            </Section>

          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchSpotIQPageContent;
