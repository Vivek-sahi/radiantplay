import React from 'react';
import { c, ff } from '../styles';

interface StorySectionProps {
  onStartProblemLed: () => void;
  onStartSystemLed: () => void;
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

const Headline: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 style={{
    fontSize: 36, fontWeight: 700, color: c['content-primary'], lineHeight: 1.2,
    margin: '0 0 16px', letterSpacing: '-0.02em', fontFamily: ff.primary,
  }}>
    {children}
  </h2>
);

const Body: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p style={{
    fontSize: 16, color: c['content-secondary'], lineHeight: 1.7,
    margin: 0, fontFamily: ff.primary,
  }}>
    {children}
  </p>
);

// ── Slide layout: top-down ────────────────────────────────────────────────────

const Slide: React.FC<{
  headline: string;
  body?: React.ReactNode;
  visual: React.ReactNode;
  bg?: string;
}> = ({ headline, body, visual, bg = '#fff' }) => (
  <div style={{
    width: '100%', height: '100%', flexShrink: 0,
    scrollSnapAlign: 'start',
    display: 'flex', flexDirection: 'column',
    justifyContent: 'center',
    backgroundColor: bg,
    padding: '48px 120px',
    boxSizing: 'border-box',
    gap: 28,
  }}>
    <div>
      <Headline>{headline}</Headline>
      {body && <Body>{body}</Body>}
    </div>
    <div>
      {visual}
    </div>
  </div>
);

// ── Slide 1 visual: Slack message ─────────────────────────────────────────────

const SlackVisual: React.FC = () => (
  <div style={{
    backgroundColor: '#1a1d21',
    borderRadius: 14,
    padding: '20px 24px',
    maxWidth: 560,
  }}>
    {/* Channel header */}
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18,
      paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.08)',
    }}>
      <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)' }}>#</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', fontFamily: ff.primary }}>
        analytics-team
      </span>
    </div>

    {/* VP message */}
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 7, flexShrink: 0,
        background: 'linear-gradient(135deg, #c0392b, #e74c3c)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: ff.primary,
      }}>K</div>
      <div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: ff.primary }}>Kristen (VP of Sales)</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: ff.primary }}>2:04 PM</span>
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontFamily: ff.primary, lineHeight: 1.55 }}>
          Hey, the Q1 revenue numbers look wrong in ThoughtSpot. Can you check?
        </div>
      </div>
    </div>

    {/* Analyst reply */}
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 7, flexShrink: 0,
        background: 'linear-gradient(135deg, #2980b9, #3498db)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: ff.primary,
      }}>A</div>
      <div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: ff.primary }}>Alex (Data Analyst)</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: ff.primary }}>2:07 PM</span>
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontFamily: ff.primary, lineHeight: 1.55 }}>
          On it. Checking the model now...
        </div>
      </div>
    </div>

    {/* Time gap */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' }} />
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontFamily: ff.primary }}>4 hours later</span>
      <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' }} />
    </div>

    {/* Final analyst message */}
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{
        width: 32, height: 32, borderRadius: 7, flexShrink: 0,
        background: 'linear-gradient(135deg, #2980b9, #3498db)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: ff.primary,
      }}>A</div>
      <div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: ff.primary }}>Alex (Data Analyst)</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: ff.primary }}>6:41 PM</span>
        </div>
        <div style={{
          fontSize: 13, fontFamily: ff.primary, lineHeight: 1.55,
          backgroundColor: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 7, padding: '8px 12px',
          color: 'rgba(255,255,255,0.55)',
        }}>
          Found it — a null in the cost column is propagating. Working on a fix. This one took a while to trace.
        </div>
      </div>
    </div>
  </div>
);

// ── Slide 2 visual: comparison table ─────────────────────────────────────────

const GapTableVisual: React.FC = () => {
  const rows = [
    {
      stage: 'Before data enters',
      who: 'Data engineer',
      what: 'Automated checks — nulls, schema, type validation',
      works: 'Catches structural issues early',
      fails: 'No business context; doesn\'t know what columns actually matter',
      stageAccent: '#d97706',
    },
    {
      stage: 'After user complaints',
      who: 'Data analyst',
      what: 'Manual trace — liveboard → model → warehouse → source',
      works: 'Eventually finds the root cause',
      fails: 'No tooling; hours of work; trust is already broken',
      stageAccent: '#dc2626',
    },
  ];

  const thStyle: React.CSSProperties = {
    padding: '10px 16px',
    fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
    color: c['content-secondary'], textTransform: 'uppercase',
    textAlign: 'left',
    borderBottom: `1px solid ${c['border-divider']}`,
    backgroundColor: c['background-subtle'],
  };

  const tdStyle: React.CSSProperties = {
    padding: '14px 16px',
    fontSize: 13, color: c['content-secondary'],
    verticalAlign: 'top', lineHeight: 1.5,
    borderBottom: `1px solid ${c['border-divider']}`,
  };

  return (
    <div style={{
      borderRadius: 12, border: `1px solid ${c['border-divider']}`,
      overflow: 'hidden', fontFamily: ff.primary,
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, width: 180 }}>Stage</th>
            <th style={{ ...thStyle, width: 140 }}>Who</th>
            <th style={thStyle}>What they do</th>
            <th style={{ ...thStyle, width: 200 }}>What works</th>
            <th style={{ ...thStyle, width: 260 }}>What doesn't</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.stage} style={{ backgroundColor: '#fff' }}>
              <td style={{
                ...tdStyle,
                fontWeight: 600, color: c['content-primary'],
                borderLeft: `3px solid ${row.stageAccent}`,
              }}>
                {row.stage}
              </td>
              <td style={{ ...tdStyle, fontWeight: 500, color: c['content-primary'] }}>
                {row.who}
              </td>
              <td style={tdStyle}>{row.what}</td>
              <td style={{ ...tdStyle }}>
                <span style={{
                  display: 'inline-block',
                  fontSize: 12, fontWeight: 600,
                  color: '#166534', backgroundColor: '#f0fdf4',
                  borderRadius: 4, padding: '2px 8px',
                }}>
                  ✓ {row.works}
                </span>
              </td>
              <td style={{ ...tdStyle }}>
                <span style={{
                  display: 'inline-block',
                  fontSize: 12, fontWeight: 600,
                  color: '#9f1239', backgroundColor: '#fff1f2',
                  borderRadius: 4, padding: '2px 8px',
                  lineHeight: 1.5,
                }}>
                  ✗ {row.fails}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Slide 3 visual: context + data → prep → trust ────────────────────────────

const PrepContextVisual: React.FC = () => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 16,
    fontFamily: ff.primary,
  }}>
    {/* Input 1: Business context */}
    <div style={{
      flex: 1, padding: '18px 20px', borderRadius: 12,
      backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe',
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', marginBottom: 10, letterSpacing: '0.04em' }}>
        Business context
      </div>
      {['Which models matter', 'Liveboard impact', 'Users affected', 'Usage patterns'].map(item => (
        <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#a78bfa', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#374151' }}>{item}</span>
        </div>
      ))}
    </div>

    <div style={{ fontSize: 20, color: c['content-tertiary'], fontWeight: 300, flexShrink: 0 }}>+</div>

    {/* Input 2: Data quality */}
    <div style={{
      flex: 1, padding: '18px 20px', borderRadius: 12,
      backgroundColor: '#eff6ff', border: '1px solid #bfdbfe',
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', marginBottom: 10, letterSpacing: '0.04em' }}>
        Data quality
      </div>
      {['Null values', 'Type mismatches', 'Duplicate rows', 'Schema drift'].map(item => (
        <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#93c5fd', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#374151' }}>{item}</span>
        </div>
      ))}
    </div>

    <div style={{ fontSize: 20, color: c['content-tertiary'], flexShrink: 0 }}>→</div>

    {/* Prep */}
    <div style={{
      flex: 1.4, padding: '18px 24px', borderRadius: 12,
      backgroundColor: '#1e293b', border: '1px solid #334155',
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 8,
      }}>
        ThoughtSpot Prep
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', lineHeight: 1.5 }}>
        Understands what the data means to your business — not just what's broken
      </div>
    </div>

    <div style={{ fontSize: 20, color: c['content-tertiary'], flexShrink: 0 }}>→</div>

    {/* Outcome */}
    <div style={{
      flex: 1, padding: '18px 20px', borderRadius: 12,
      backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', textAlign: 'center',
    }}>
      <div style={{ fontSize: 22, marginBottom: 8 }}>✓</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#166534', lineHeight: 1.45 }}>
        Answers your users can trust
      </div>
    </div>
  </div>
);

// ── Slide 4 visual: two journeys stacked ─────────────────────────────────────

const TwoJourneyVisual: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
    {[
      {
        icon: '💬',
        label: 'Problem-led',
        desc: `A business user reports a wrong answer. The analyst needs to diagnose fast and fix a specific problem. They come in with context: "My revenue column is wrong."`,
        accent: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe',
      },
      {
        icon: '📊',
        label: 'System-led',
        desc: 'The data person built a model and discovers quality issues themselves before shipping to business users. They want a broad sweep before anything goes live.',
        accent: '#2563eb', bg: '#eff6ff', border: '#bfdbfe',
      },
    ].map(card => (
      <div key={card.label} style={{
        padding: '18px 22px', borderRadius: 12,
        backgroundColor: card.bg, border: `1px solid ${card.border}`,
        display: 'flex', gap: 16, alignItems: 'flex-start',
        fontFamily: ff.primary,
      }}>
        <div style={{ fontSize: 24, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>{card.icon}</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: card.accent, marginBottom: 5, letterSpacing: '0.04em' }}>
            {card.label}
          </div>
          <div style={{ fontSize: 14, color: c['content-secondary'], lineHeight: 1.6 }}>
            {card.desc}
          </div>
        </div>
      </div>
    ))}
  </div>
);

// ── Cover slide ───────────────────────────────────────────────────────────────

const CoverSlide: React.FC = () => (
  <div style={{
    width: '100%', height: '100%', flexShrink: 0,
    scrollSnapAlign: 'start',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#0f172a',
    padding: '0 80px',
    boxSizing: 'border-box',
    position: 'relative',
    gap: 16,
  }}>
    {/* Icon mark */}
    <div style={{
      width: 64, height: 64, borderRadius: 16,
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 26, fontWeight: 800, color: '#fff', fontFamily: ff.primary,
      marginBottom: 12,
      boxShadow: '0 12px 40px rgba(99,102,241,0.35)',
    }}>S</div>

    <h1 style={{
      fontSize: 80, fontWeight: 800, color: '#fff',
      margin: 0, letterSpacing: '-0.04em', lineHeight: 1.0,
      fontFamily: ff.primary, textAlign: 'center',
    }}>SpotterPrep</h1>

    <p style={{
      fontSize: 22, color: 'rgba(255,255,255,0.45)',
      margin: 0, fontFamily: ff.primary, textAlign: 'center',
      fontWeight: 400, letterSpacing: '-0.01em',
    }}>Data prep within ThoughtSpot</p>

    <div style={{
      marginTop: 8,
      padding: '6px 16px', borderRadius: 100,
      backgroundColor: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.1)',
      fontSize: 11, fontWeight: 700,
      letterSpacing: '0.12em', textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.3)', fontFamily: ff.primary,
    }}>
      UX concept · 2026
    </div>

    <div style={{
      position: 'absolute', bottom: 40,
      fontSize: 12, color: 'rgba(255,255,255,0.2)',
      fontFamily: ff.primary, letterSpacing: '0.04em',
    }}>
      ↓ scroll to explore
    </div>
  </div>
);

// ── Slide 5: CTA ──────────────────────────────────────────────────────────────

const CTASlide: React.FC<{
  onStartProblemLed: () => void;
  onStartSystemLed: () => void;
}> = ({ onStartProblemLed, onStartSystemLed }) => (
  <div style={{
    width: '100%', height: '100%', flexShrink: 0,
    scrollSnapAlign: 'start',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: c['background-base-inverse'],
    padding: '0 80px',
    boxSizing: 'border-box',
    gap: 24,
  }}>
    <h2 style={{
      fontSize: 44, fontWeight: 700, color: '#fff', lineHeight: 1.15,
      margin: 0, textAlign: 'center', letterSpacing: '-0.02em',
      fontFamily: ff.primary, maxWidth: 600,
    }}>
      See it in action
    </h2>

    <p style={{
      fontSize: 17, color: 'rgba(255,255,255,0.55)', textAlign: 'center',
      margin: 0, fontFamily: ff.primary, maxWidth: 480, lineHeight: 1.65,
    }}>
      Both run in the same prototype. Choose a starting point — you'll land on the data models screen.
    </p>

    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20,
      width: '100%', maxWidth: 760, marginTop: 8,
    }}>
      {[
        {
          icon: '💬', tag: 'Problem-led',
          headline: 'You know the symptom.',
          sub: 'The agent diagnoses it.',
          desc: 'A VP flags wrong numbers. Walk through how the prep agent helps you debug, identify root causes, and apply targeted fixes.',
          cta: 'Start Problem-led', btnBg: '#7c3aed',
          border: 'rgba(139,92,246,0.3)', bg: 'rgba(139,92,246,0.08)',
          onClick: onStartProblemLed,
        },
        {
          icon: '📊', tag: 'System-led',
          headline: 'The platform surfaces it',
          sub: 'before your VP does.',
          desc: 'Quality scores, proactive scanning, and a generated fix plan — all applied before anyone notices something is wrong.',
          cta: 'Start System-led', btnBg: '#2563eb',
          border: 'rgba(59,130,246,0.3)', bg: 'rgba(59,130,246,0.08)',
          onClick: onStartSystemLed,
        },
      ].map(card => (
        <div key={card.tag} style={{
          padding: 32, borderRadius: 16,
          backgroundColor: card.bg, border: `1px solid ${card.border}`,
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>{card.icon}</div>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
            color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
            fontFamily: ff.primary, marginBottom: 8,
          }}>{card.tag}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: ff.primary, marginBottom: 2 }}>{card.headline}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.55)', fontFamily: ff.primary, marginBottom: 16 }}>{card.sub}</div>
          <div style={{
            fontSize: 14, color: 'rgba(255,255,255,0.5)', fontFamily: ff.primary,
            lineHeight: 1.65, flex: 1, marginBottom: 24,
          }}>{card.desc}</div>
          <button onClick={card.onClick} style={{
            padding: '12px 20px', border: 'none', borderRadius: 8,
            backgroundColor: card.btnBg, color: '#fff',
            fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: ff.primary,
          }}>
            {card.cta} →
          </button>
        </div>
      ))}
    </div>
  </div>
);

// ── StorySection ──────────────────────────────────────────────────────────────

const StorySection: React.FC<StorySectionProps> = ({ onStartProblemLed, onStartSystemLed }) => (
  <div style={{
    width: '100%', height: '100%',
    overflowY: 'scroll',
    scrollSnapType: 'y mandatory',
    fontFamily: ff.primary,
  }}>
    <CoverSlide />

    <Slide
      headline="The Problem"
      body={`Data quality issues are discovered late — after models are built and business users are already asking questions on them. A VP of Sales messages their data analyst on Slack: "I'm getting wrong answers on revenue." This is the moment trust erodes. Data quality is directly linked to trust in any BI platform.`}
      visual={<SlackVisual />}
    />

    <Slide
      headline="How It Happens Today"
      body="Before data comes into the system, data engineers run basic checks — without business context. Once done, they mark the job complete. When business users start asking questions, they find issues. The analyst then has to traverse a complex pipeline to debug. There is no tooling to help with this. It is entirely manual."
      visual={<GapTableVisual />}
      bg={c['background-sunken']}
    />

    <Slide
      headline="The Opportunity"
      body={`ThoughtSpot has a unique opportunity to build a prep platform that is rich in business context — something no warehouse tool has. ThoughtSpot knows which models drive which liveboards. It knows how many users are affected. It can say: "This data quality issue is impacting 10 liveboards and 10,000 Spot answers." That context makes a smart prep system possible, not just a null-checker.`}
      visual={<PrepContextVisual />}
    />

    <Slide
      headline="Two User Journeys"
      body="Two ways the same platform helps different people — reactive and proactive."
      visual={<TwoJourneyVisual />}
      bg={c['background-sunken']}
    />

    <CTASlide
      onStartProblemLed={onStartProblemLed}
      onStartSystemLed={onStartSystemLed}
    />
  </div>
);

export default StorySection;
