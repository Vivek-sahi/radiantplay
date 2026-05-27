import React from 'react';
import { systemColors } from '../../tokens/colors';

const font = '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const brand = systemColors.light['content-brand'];

export const TermsPageContent: React.FC = () => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>

    {/* Sticky header */}
    <div style={{ flexShrink: 0, padding: '28px 40px 20px', borderBottom: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' }}>
      <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#0F172A', fontFamily: font, letterSpacing: '-0.3px' }}>
        Terms
      </h1>
    </div>

    {/* Scrollable content */}
    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#F3F4F6' }}>
      <div style={{ padding: '24px 40px 64px' }}>

        {/* Card */}
        <div style={{ backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
          {/* Card header */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #E5E7EB', backgroundColor: '#F3F4F6' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827', fontFamily: font }}>User agreement</span>
          </div>
          {/* Card body */}
          <div style={{ padding: '20px 24px', backgroundColor: '#FFFFFF' }}>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#6B7280', fontFamily: font, lineHeight: 1.6 }}>
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
