import React from 'react';

const font = '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export const ScheduledMaintenancePageContent: React.FC = () => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>

    {/* Sticky header */}
    <div style={{ flexShrink: 0, padding: '28px 40px 20px', borderBottom: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' }}>
      <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 700, color: '#0F172A', fontFamily: font, letterSpacing: '-0.3px' }}>
        Scheduled maintenance
      </h1>
      <p style={{ margin: 0, fontSize: '13.5px', color: '#6B7280', fontFamily: font }}>
        This is a summary of your latest scheduled maintenance for your cluster.
      </p>
    </div>

    {/* Scrollable content */}
    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#F3F4F6' }}>
      <div style={{ padding: '24px 40px 64px' }}>

        {/* Card */}
        <div style={{ backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
          {/* Card header */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #E5E7EB', backgroundColor: '#F3F4F6' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827', fontFamily: font }}>Status</span>
          </div>
          {/* Card body */}
          <div style={{ padding: '0', backgroundColor: '#FFFFFF' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px',
            }}>
              <span style={{ fontSize: '13.5px', fontWeight: 500, color: '#111827', fontFamily: font }}>Status</span>
              <span style={{ fontSize: '13.5px', color: '#6B7280', fontFamily: font }}>No maintenance is currently scheduled</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
);

export default ScheduledMaintenancePageContent;
