import React from 'react';
import { sysVar } from '@tokens/colors';

const font = 'var(--font-family-primary)';
const brand = sysVar('content-brand');

export const TermsPageContent: React.FC = () => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: sysVar('background-base') }}>

    {/* Sticky header */}
    <div style={{ flexShrink: 0, padding: '28px 40px 20px', borderBottom: `1px solid ${sysVar('border-subtle')}`, backgroundColor: sysVar('background-base') }}>
      <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: sysVar('content-primary'), fontFamily: font, letterSpacing: '-0.3px' }}>
        Terms
      </h1>
    </div>

    {/* Scrollable content */}
    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: sysVar('background-secondary-action') }}>
      <div style={{ padding: '24px 40px 64px' }}>

        {/* Card */}
        <div style={{ backgroundColor: sysVar('background-secondary-action'), border: `1px solid ${sysVar('border-subtle')}`, borderRadius: '12px', overflow: 'hidden' }}>
          {/* Card header */}
          <div style={{ padding: '16px 24px', borderBottom: `1px solid ${sysVar('border-subtle')}`, backgroundColor: sysVar('background-secondary-action') }}>
            <span style={{ fontSize: '14px', fontWeight: 'var(--font-weight-emphasis)', color: sysVar('content-primary'), fontFamily: font }}>User agreement</span>
          </div>
          {/* Card body */}
          <div style={{ padding: '20px 24px', backgroundColor: sysVar('background-base') }}>
            <p style={{ margin: 0, fontSize: '13.5px', color: sysVar('content-secondary'), fontFamily: font, lineHeight: 1.6 }}>
              Your organisation has accepted this{' '}
              <a
                href="#"
                style={{ color: brand, textDecoration: 'none', fontWeight: 500 }}
                onClick={(e) => e.preventDefault()}
              >
                ThoughtSpot Subscription Agreement
              </a>
              {' '}prior to using the ThoughtSpot service.
            </p>
          </div>
        </div>

      </div>
    </div>
  </div>
);

export default TermsPageContent;
