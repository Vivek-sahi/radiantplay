import React from 'react';
import { c, sp, fs, fw, ff } from '../styles';

interface WorkflowDirectoryProps {
  onClose: () => void;
}

const WORKFLOWS = [
  { num: '01', name: 'Connect a data source',      desc: 'Link a warehouse, spreadsheet, or DBT project' },
  { num: '02', name: 'Create a new model',          desc: 'Import structure and start building a data model' },
  { num: '03', name: 'Build / modify a model',      desc: 'Add tables, define joins, manage columns' },
  { num: '04', name: 'Coach a model',               desc: 'Write context, synonyms, and semantic metadata' },
  { num: '05', name: 'Test a model',                desc: 'Run tests, identify gaps, route fixes' },
  { num: '06', name: 'Cache a model',               desc: 'Enable caching and set refresh frequency' },
  { num: '07', name: 'Prep data quality',           desc: 'Scan, review, and apply data quality fixes' },
  { num: '08', name: 'Publish a model',             desc: 'Set access and make the model live for Spotter' },
  { num: '09', name: 'Resolve an alert',            desc: 'Diagnose source issues and route to a fix' },
  { num: '10', name: 'Explore a table',             desc: 'Browse columns, preview data, view usage' },
  { num: '11', name: 'Debug a conversation',        desc: 'Find root cause of a Spotter failure and fix inline' },
  { num: '12', name: 'Govern',                      desc: 'Manage business terms and catalog integrations' },
];

const WorkflowDirectory: React.FC<WorkflowDirectoryProps> = ({ onClose }) => (
  <div
    style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'rgba(29,35,47,0.5)',
      zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
    onClick={onClose}
  >
    <div
      style={{
        width: 700, maxHeight: '80vh',
        backgroundColor: c['background-base'],
        borderRadius: 12,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div style={{
        padding: `${sp.D}px ${sp.F}px`,
        borderBottom: `1px solid ${c['border-divider']}`,
        display: 'flex', alignItems: 'center',
        flexShrink: 0,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'] }}>Workflow directory</div>
          <div style={{ fontSize: fs.xs, color: c['content-secondary'], marginTop: 2 }}>Select a workflow to begin</div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: c['content-secondary'], fontSize: 20, lineHeight: 1, padding: 4 }}
        >
          ×
        </button>
      </div>

      {/* Workflow grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: sp.D }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: sp.B,
        }}>
          {WORKFLOWS.map(wf => (
            <button
              key={wf.num}
              style={{
                textAlign: 'left' as const,
                padding: sp.D,
                backgroundColor: c['background-sunken'],
                border: `1px solid ${c['border-divider']}`,
                borderRadius: 8, cursor: 'pointer',
                fontFamily: ff.primary,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: sp.B }}>
                <span style={{
                  fontSize: 11, fontWeight: fw.medium,
                  color: c['content-tertiary'],
                  flexShrink: 0, marginTop: 2,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {wf.num}
                </span>
                <div>
                  <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'] }}>{wf.name}</div>
                  <div style={{ fontSize: fs.xs, color: c['content-secondary'], marginTop: 3, lineHeight: 1.5 }}>{wf.desc}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default WorkflowDirectory;
