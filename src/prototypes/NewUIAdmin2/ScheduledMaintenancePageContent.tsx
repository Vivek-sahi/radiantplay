import React from 'react';
import { sysVar } from '@tokens/colors';

const font = 'var(--font-family-primary)';

export const ScheduledMaintenancePageContent: React.FC = () => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: sysVar('background-base') }}>

    {/* Sticky header */}
    <div style={{ flexShrink: 0, padding: '28px 40px 20px', borderBottom: `1px solid ${sysVar('border-subtle')}`, backgroundColor: sysVar('background-base') }}>
      <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 700, color: sysVar('content-primary'), fontFamily: font, letterSpacing: '-0.3px' }}>
        Scheduled maintenance
      </h1>
      <p style={{ margin: 0, fontSize: '13.5px', color: sysVar('content-secondary'), fontFamily: font }}>
        This is a summary of your latest scheduled maintenance for your cluster.
      </p>
    </div>

    {/* Scrollable content */}
    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: sysVar('background-secondary-action') }}>
      <div style={{ padding: '24px 40px 64px' }}>

        {/* Card */}
        <div style={{ backgroundColor: sysVar('background-secondary-action'), border: `1px solid ${sysVar('border-subtle')}`, borderRadius: '12px', overflow: 'hidden' }}>
          {/* Card header */}
          <div style={{ padding: '16px 24px', borderBottom: `1px solid ${sysVar('border-subtle')}`, backgroundColor: sysVar('background-secondary-action') }}>
            <span style={{ fontSize: '14px', fontWeight: 'var(--font-weight-emphasis)', color: sysVar('content-primary'), fontFamily: font }}>Status</span>
          </div>
          {/* Card body */}
          <div style={{ padding: '0', backgroundColor: sysVar('background-base') }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px',
            }}>
              <span style={{ fontSize: '13.5px', fontWeight: 500, color: sysVar('content-primary'), fontFamily: font }}>Status</span>
              <span style={{ fontSize: '13.5px', color: sysVar('content-secondary'), fontFamily: font }}>No maintenance is currently scheduled</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
);

export default ScheduledMaintenancePageContent;
