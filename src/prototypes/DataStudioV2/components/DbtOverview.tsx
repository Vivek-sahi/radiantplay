import React, { useState } from 'react';
import { c, sp, fs, fw, ff } from '../styles';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import DbtImportWizard from './DbtImportWizard';

interface DbtOverviewProps {
  onImportComplete:  () => void;
  onReviewIssues:    (modelName: string) => void;
}

const DbtLogo: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <div style={{
    width: size, height: size, borderRadius: Math.round(size * 0.18),
    backgroundColor: '#FF694A', color: 'white',
    fontSize: size * 0.38, fontWeight: fw.semibold,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, fontFamily: ff.primary,
  }}>
    d
  </div>
);

const VALUE_PROPS = [
  { title: 'Live link',        desc: 'dbt changes auto-sync to ThoughtSpot. Refresh on demand.' },
  { title: 'AI catches issues', desc: 'Chasm traps, missing synonyms — flagged before publish.' },
  { title: 'Push back to dbt', desc: 'Promote your overrides back to your dbt project.' },
];

const DbtOverview: React.FC<DbtOverviewProps> = ({ onImportComplete, onReviewIssues }) => {
  const [wizardOpen, setWizardOpen] = useState(false);

  const handleImportClose = () => {
    setWizardOpen(false);
    onImportComplete();
  };

  const handleReviewIssues = (modelName: string) => {
    setWizardOpen(false);
    onReviewIssues(modelName);
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
          <div style={{ fontSize: fs.xs, color: c['content-tertiary'], marginTop: 2, fontFamily: ff.primary }}>
            dbt models and semantic views imported into ThoughtSpot
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

      {/* Empty state body */}
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: c['background-sunken'], padding: `${sp.J}px ${sp.H}px` }}>
        <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center', fontFamily: ff.primary }}>
          <DbtLogo size={52} />
          <h2 style={{ margin: `${sp.D}px 0 0`, fontSize: 22, fontWeight: fw.semibold, color: c['content-primary'], letterSpacing: '-0.3px' }}>
            No dbt projects connected
          </h2>
          <p style={{ marginTop: sp.B, marginBottom: sp.G, fontSize: fs.sm, color: c['content-secondary'], lineHeight: 1.6 }}>
            Import your dbt project to build models in ThoughtSpot. Your models stay in sync automatically.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: sp.C, textAlign: 'left', marginBottom: sp.G }}>
            {VALUE_PROPS.map(v => (
              <Card key={v.title}>
                <div style={{ padding: sp.D }}>
                  <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'], marginBottom: sp.A }}>
                    {v.title}
                  </div>
                  <div style={{ fontSize: fs.xs, color: c['content-secondary'], lineHeight: 1.5 }}>
                    {v.desc}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Button variant="primary" onClick={() => setWizardOpen(true)}>
            Import dbt project
          </Button>
        </div>
      </div>

      {wizardOpen && (
        <DbtImportWizard
          onClose={() => setWizardOpen(false)}
          onImportClose={handleImportClose}
          onReviewIssues={handleReviewIssues}
          onPublishModel={() => {}}
        />
      )}
    </>
  );
};

export default DbtOverview;
