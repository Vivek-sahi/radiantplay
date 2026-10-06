import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getComponentCount } from '../data/componentRegistry';

const PRIORITY_FILES = [
  { priority: 1, file: '_orchestration.md', role: 'Router', desc: 'Determines which guidelines to consult based on the task type' },
  { priority: 2, file: 'prototype-generation.md', role: 'Core hub', desc: 'Code structure, import patterns, and generation workflow steps' },
  { priority: 3, file: 'component-inventory.md', role: 'Component picker', desc: 'Decision tree to find the right component for each UI element' },
  { priority: 4, file: 'widget-patterns.md', role: 'Interaction rules', desc: 'Alert types, menu ordering, delete confirmation, tooltips, tables' },
  { priority: 5, file: 'layout-patterns.md', role: 'Page templates', desc: 'Dashboard, admin, form, table page, and wizard layouts' },
  { priority: 6, file: 'figma-component-mapping.md', role: 'Figma translator', desc: 'Maps Figma layer names and screenshots to Radiant components' },
  { priority: 7, file: 'modal-patterns.md', role: 'Modal guide', desc: 'Size selection (M1-M4), types, footer placement, wizard progress' },
  { priority: 8, file: 'token-usage.md', role: 'Styling ref', desc: 'Color scales, spacing values, typography — never hard-code' },
  { priority: 9, file: 'content-guidelines.md', role: 'UI text rules', desc: 'Button labels, titles, errors — ThoughtSpot content patterns' },
  { priority: 10, file: 'product-knowledge.md', role: 'Domain context', desc: 'ThoughtSpot features: Answers, Liveboards, Spotter, SpotIQ' },
];

const DECISION_BRANCHES = [
  { input: 'Figma screenshot or URL', route: 'figma-component-mapping → prototype-generation', color: '#2770EF', emoji: '🎨' },
  { input: 'Text description of a UI', route: 'prototype-generation + component-inventory', color: '#06BF7F', emoji: '💬' },
  { input: 'Dashboard / admin / settings', route: 'layout-patterns → prototype-generation', color: '#7B61FF', emoji: '📊' },
  { input: 'Modal / wizard / dialog', route: 'modal-patterns → prototype-generation', color: '#F5A623', emoji: '🪟' },
  { input: 'Table / menu / alert / toast', route: 'widget-patterns → prototype-generation', color: '#EF4444', emoji: '📋' },
];

export const HowItWorksPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        .hiw-back:hover { background: rgba(255,255,255,.12) !important; color: rgba(255,255,255,.7) !important; border-color: rgba(255,255,255,.2) !important; }
        .hiw-branch:hover { background: rgba(255,255,255,.08) !important; transform: translateX(4px); }
        .hiw-priority:hover { background: rgba(255,255,255,.08) !important; }
        .hiw-reuse:hover { background: rgba(255,255,255,.08) !important; transform: translateY(-3px); }
        .hiw-cta:hover { transform: translateY(-3px) !important; box-shadow: 0 12px 36px rgba(39,112,239,.5) !important; }
        .hiw-cta:hover svg { transform: translateX(3px); }
        .hiw-cta svg { transition: transform .2s; }
        @keyframes drawLine { from { stroke-dashoffset: 600; } to { stroke-dashoffset: 0; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseDot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .4; transform: scale(.75); } }
      `}</style>

      {/* ── Chrome ──────────────────────────────────────────── */}
      <div style={styles.wordmark} onClick={() => navigate('/')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate('/')}>
        <div style={styles.wordmarkIcon}>R</div>
        <div style={styles.wordmarkText}>Radiant<span style={{ color: '#ABC7F9' }}>Play</span></div>
      </div>

      <button className="hiw-back" style={styles.backBtn} onClick={() => navigate('/')}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M12.6667 8H3.33334" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 3.33334L3.33334 8L8 12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Back to home
      </button>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section style={styles.hero}>
        <div style={styles.heroInner}>
          <div style={styles.heroEyebrow}>
            <div style={styles.heroDot} />
            Behind the scenes
          </div>
          <h1 style={styles.heroTitle}>
            How prototyping <em style={styles.heroTitleEm}>works</em>
          </h1>
          <p style={styles.heroSub}>
            When you describe a UI, the AI doesn't guess — it follows a structured system of guideline files.
            An orchestrator routes your request to the right rules, ensuring consistent, production-quality output every time.
          </p>
        </div>
      </section>

      {/* ── Section 1: Pipeline ─────────────────────────────── */}
      <section style={styles.section}>
        <div style={styles.sectionInner}>
          <div style={styles.label}>Step by step</div>
          <h2 style={styles.h2}>The AI pipeline</h2>
          <p style={styles.sub}>Every request flows through a 5-step pipeline — from your natural language prompt to production-quality React code.</p>

          {/* Pipeline SVG illustration */}
          <div style={styles.pipelineWrap}>
            <svg viewBox="0 0 760 320" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', display: 'block' }}>
              {/* Connecting line */}
              <path d="M 380 30 L 380 290" stroke="rgba(113,161,244,.2)" strokeWidth="2" strokeDasharray="6 4" />

              {/* Step nodes */}
              {[
                { y: 20, color: '#2770EF', label: 'Your prompt', desc: 'Describe what you want in plain English' },
                { y: 88, color: '#7B61FF', label: 'Orchestrator classifies', desc: '_orchestration.md reads your input type' },
                { y: 156, color: '#06BF7F', label: 'Loads guidelines', desc: 'Up to 10 rule files consulted in order' },
                { y: 224, color: '#F5A623', label: `Checks ${getComponentCount()}+ components`, desc: 'Reuses existing before creating new' },
                { y: 292, color: '#EF4444', label: 'Generates code', desc: 'Outputs React + TypeScript + tokens' },
              ].map((step, i) => (
                <g key={i}>
                  <circle cx="380" cy={step.y} r="14" fill={step.color} opacity="0.15" />
                  <circle cx="380" cy={step.y} r="8" fill={step.color} />
                  <text x="410" y={step.y - 4} fill="#fff" fontSize="14" fontWeight="700" fontFamily="Inter, sans-serif">{step.label}</text>
                  <text x="410" y={step.y + 14} fill="rgba(255,255,255,.4)" fontSize="12" fontFamily="Inter, sans-serif">{step.desc}</text>
                  {/* Step number on left */}
                  <text x="350" y={step.y + 5} fill={step.color} fontSize="13" fontWeight="800" fontFamily="Inter, sans-serif" textAnchor="end">{i + 1}</text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </section>

      {/* ── Section 2: Smart Routing ────────────────────────── */}
      <section style={{ ...styles.section, background: 'radial-gradient(ellipse at 70% 30%, #0d2040 0%, #1D232F 65%)' }}>
        <div style={styles.sectionInner}>
          <div style={styles.label}>Intelligent routing</div>
          <h2 style={styles.h2}>Smart routing</h2>
          <p style={styles.sub}>The orchestrator reads your input type and routes to the most relevant guideline files. Different inputs trigger different file paths.</p>

          <div style={styles.branchGrid}>
            {DECISION_BRANCHES.map((branch, i) => (
              <div key={i} className="hiw-branch" style={styles.branchCard}>
                <div style={{ ...styles.branchEmoji, background: `${branch.color}20` }}>{branch.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={styles.branchInput}>{branch.input}</div>
                  <div style={styles.branchRoute}>{branch.route}</div>
                </div>
                <div style={{ ...styles.branchDot, background: branch.color }} />
              </div>
            ))}
          </div>

          {/* Routing illustration */}
          <div style={styles.routingIllustration}>
            <svg viewBox="0 0 700 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', display: 'block' }}>
              {/* Center node */}
              <rect x="280" y="55" width="140" height="50" rx="12" fill="rgba(39,112,239,.15)" stroke="rgba(39,112,239,.4)" strokeWidth="1.5" />
              <text x="350" y="77" fill="#71A1F4" fontSize="11" fontWeight="700" fontFamily="Inter, sans-serif" textAnchor="middle" letterSpacing=".08em">ORCHESTRATOR</text>
              <text x="350" y="93" fill="rgba(255,255,255,.35)" fontSize="10" fontFamily="Inter, sans-serif" textAnchor="middle">routes your request</text>

              {/* Left: Input */}
              <rect x="30" y="60" width="120" height="40" rx="10" fill="rgba(255,255,255,.05)" stroke="rgba(255,255,255,.1)" strokeWidth="1" />
              <text x="90" y="84" fill="rgba(255,255,255,.6)" fontSize="12" fontWeight={550} fontFamily="Inter, sans-serif" textAnchor="middle">Your prompt</text>
              <path d="M 150 80 L 280 80" stroke="rgba(113,161,244,.3)" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrowB)" />

              {/* Right: outputs */}
              {[
                { y: 20, label: 'Layout rules', color: '#7B61FF' },
                { y: 60, label: 'Component check', color: '#06BF7F' },
                { y: 100, label: 'Token enforcement', color: '#F5A623' },
                { y: 140, label: 'Code generation', color: '#EF4444' },
              ].map((item, i) => (
                <g key={i}>
                  <path d={`M 420 80 Q 470 ${item.y + 15} 530 ${item.y + 15}`} stroke={`${item.color}50`} strokeWidth="1.5" fill="none" />
                  <circle cx="530" cy={item.y + 15} r="4" fill={item.color} />
                  <text x="542" y={item.y + 19} fill="rgba(255,255,255,.55)" fontSize="11" fontWeight={550} fontFamily="Inter, sans-serif">{item.label}</text>
                </g>
              ))}

              <defs>
                <marker id="arrowB" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
                  <path d="M 0 0 L 8 4 L 0 8" fill="none" stroke="rgba(113,161,244,.5)" strokeWidth="1.5" />
                </marker>
              </defs>
            </svg>
          </div>
        </div>
      </section>

      {/* ── Section 3: Priority Files ───────────────────────── */}
      <section style={{ ...styles.section, background: 'radial-gradient(ellipse at 20% 70%, #0a1a12 0%, #1D232F 55%)' }}>
        <div style={styles.sectionInner}>
          <div style={styles.label}>Reference system</div>
          <h2 style={styles.h2}>Priority reference files</h2>
          <p style={styles.sub}>
            The AI consults these 10 files in priority order. All live in <code style={styles.inlineCode}>.cursor/rules/</code> and are loaded automatically based on glob patterns.
          </p>

          <div style={styles.priorityGrid}>
            {PRIORITY_FILES.map((item) => (
              <div key={item.priority} className="hiw-priority" style={styles.priorityCard}>
                <div style={styles.priorityNum}>{item.priority}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.priorityFile}>{item.file}</div>
                  <div style={styles.priorityRole}>{item.role}</div>
                  <div style={styles.priorityDesc}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 4: Component Reuse ──────────────────────── */}
      <section style={{ ...styles.section, background: 'radial-gradient(ellipse at 75% 25%, #150b2a 0%, #1D232F 60%)' }}>
        <div style={styles.sectionInner}>
          <div style={styles.label}>Reuse strategy</div>
          <h2 style={styles.h2}>Component reuse</h2>
          <p style={styles.sub}>The AI always prefers existing Radiant components. New components are only created when nothing suitable exists — and they stay local to your prototype.</p>

          <div style={styles.reuseGrid}>
            {[
              { emoji: '✅', title: 'Exact match', desc: 'Imports directly from the shared component library', color: '#06BF7F', tag: 'Preferred' },
              { emoji: '🔧', title: 'Close match', desc: 'Uses existing component with custom props or styling overrides', color: '#2770EF', tag: 'Common' },
              { emoji: '🆕', title: 'No match', desc: 'Creates a local component in your prototype folder', color: '#F5A623', tag: 'Last resort' },
            ].map((item, i) => (
              <div key={i} className="hiw-reuse" style={styles.reuseCard}>
                <div style={styles.reuseEmoji}>{item.emoji}</div>
                <h3 style={styles.reuseTitle}>{item.title}</h3>
                <p style={styles.reuseDesc}>{item.desc}</p>
                <span style={{ ...styles.reuseTag, background: `${item.color}15`, color: item.color }}>{item.tag}</span>
              </div>
            ))}
          </div>

          {/* Reuse illustration */}
          <div style={styles.reuseIllustration}>
            <svg viewBox="0 0 700 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', display: 'block' }}>
              {/* Shared library box */}
              <rect x="20" y="20" width="200" height="80" rx="16" fill="rgba(6,191,127,.06)" stroke="rgba(6,191,127,.25)" strokeWidth="1.5" />
              <text x="120" y="50" fill="#06BF7F" fontSize="11" fontWeight="700" fontFamily="Inter, sans-serif" textAnchor="middle" letterSpacing=".06em">SHARED LIBRARY</text>
              <text x="120" y="68" fill="rgba(255,255,255,.35)" fontSize="11" fontFamily="Inter, sans-serif" textAnchor="middle">{getComponentCount()}+ components</text>
              <text x="120" y="84" fill="rgba(255,255,255,.25)" fontSize="10" fontFamily="Inter, sans-serif" textAnchor="middle">src/components/</text>

              {/* Arrow */}
              <path d="M 220 60 L 310 60" stroke="rgba(255,255,255,.15)" strokeWidth="1.5" strokeDasharray="4 3" />
              <text x="265" y="50" fill="rgba(255,255,255,.25)" fontSize="10" fontWeight={550} fontFamily="Inter, sans-serif" textAnchor="middle">imports</text>

              {/* Prototype box */}
              <rect x="310" y="20" width="200" height="80" rx="16" fill="rgba(39,112,239,.06)" stroke="rgba(39,112,239,.25)" strokeWidth="1.5" />
              <text x="410" y="50" fill="#71A1F4" fontSize="11" fontWeight="700" fontFamily="Inter, sans-serif" textAnchor="middle" letterSpacing=".06em">YOUR PROTOTYPE</text>
              <text x="410" y="68" fill="rgba(255,255,255,.35)" fontSize="11" fontFamily="Inter, sans-serif" textAnchor="middle">Uses shared + local</text>
              <text x="410" y="84" fill="rgba(255,255,255,.25)" fontSize="10" fontFamily="Inter, sans-serif" textAnchor="middle">src/prototypes/Name/</text>

              {/* Local components */}
              <path d="M 510 60 L 570 60" stroke="rgba(255,255,255,.1)" strokeWidth="1.5" strokeDasharray="4 3" />
              <rect x="570" y="30" width="120" height="60" rx="12" fill="rgba(245,166,35,.06)" stroke="rgba(245,166,35,.2)" strokeWidth="1" />
              <text x="630" y="55" fill="#F5A623" fontSize="10" fontWeight="700" fontFamily="Inter, sans-serif" textAnchor="middle" letterSpacing=".06em">LOCAL ONLY</text>
              <text x="630" y="72" fill="rgba(255,255,255,.3)" fontSize="10" fontFamily="Inter, sans-serif" textAnchor="middle">components/</text>
            </svg>
          </div>

          <div style={styles.noteCard}>
            <span style={{ fontSize: '16px', flexShrink: 0 }}>💡</span>
            <span>
              Local components follow the same design-system rules (tokens, forwardRef, TypeScript) but live inside your prototype folder, keeping the shared library clean.
            </span>
          </div>
        </div>
      </section>

      {/* ── Tip ─────────────────────────────────────────────── */}
      <section style={{ ...styles.section, background: 'radial-gradient(ellipse at 50% 50%, #0a1f4d 0%, #1D232F 65%)' }}>
        <div style={{ ...styles.sectionInner, textAlign: 'center' }}>
          <div style={styles.noteCardCentered}>
            <span style={{ fontSize: '18px' }}>📁</span>
            <span>
              All guideline files live in <code style={styles.inlineCode}>.cursor/rules/</code> and are automatically loaded by Cursor based on glob patterns matching the files you're editing. The orchestrator ensures the AI never misses a relevant rule.
            </span>
          </div>

          <a
            href="/guide.html"
            target="_blank"
            rel="noopener noreferrer"
            className="hiw-cta"
            style={styles.cta}
          >
            Getting started guide
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M3.33334 8H12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 3.33334L12.6667 8L8 12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      </section>
    </div>
  );
};

/* ── Styles ──────────────────────────────────────────────────────── */

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#1D232F',
    fontFamily: '"Inter", system-ui, sans-serif',
    color: '#fff',
    WebkitFontSmoothing: 'antialiased',
  },

  // Chrome
  wordmark: {
    position: 'fixed',
    top: 18,
    left: 32,
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    cursor: 'pointer',
    textDecoration: 'none',
  },
  wordmarkIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    background: 'linear-gradient(135deg, #2770EF 0%, #163772 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 900,
    color: '#fff',
    letterSpacing: '-.5px',
    boxShadow: '0 2px 8px rgba(39,112,239,.4)',
    flexShrink: 0,
  },
  wordmarkText: {
    fontSize: 14,
    fontWeight: 800,
    color: '#fff',
    letterSpacing: '-.02em',
    lineHeight: 1,
  },
  backBtn: {
    position: 'fixed',
    top: 18,
    left: 160,
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: '"Inter", system-ui, sans-serif',
    fontSize: 13,
    fontWeight: 500,
    color: 'rgba(255,255,255,.4)',
    background: 'rgba(255,255,255,.06)',
    border: '1px solid rgba(255,255,255,.1)',
    borderRadius: 100,
    padding: '6px 16px 6px 12px',
    cursor: 'pointer',
    transition: 'all .18s',
    backdropFilter: 'blur(10px)',
  },

  // Hero
  hero: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '52px 72px',
    background: 'linear-gradient(145deg, #082559 0%, #163772 40%, #1a3a8a 100%)',
    position: 'relative',
    overflow: 'hidden',
  },
  heroInner: {
    maxWidth: 780,
    position: 'relative',
    zIndex: 1,
  },
  heroEyebrow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '.14em',
    textTransform: 'uppercase',
    color: '#ABC7F9',
    marginBottom: 24,
  },
  heroDot: {
    width: 6,
    height: 6,
    background: '#71A1F4',
    borderRadius: '50%',
    animation: 'pulseDot 2s infinite',
  },
  heroTitle: {
    fontSize: 'clamp(36px, 4.2vw, 58px)',
    fontWeight: 900,
    letterSpacing: '-.03em',
    lineHeight: 1.08,
    marginBottom: 22,
  },
  heroTitleEm: {
    fontStyle: 'normal',
    color: '#ABC7F9',
  },
  heroSub: {
    fontSize: 18,
    color: 'rgba(255,255,255,.65)',
    lineHeight: 1.65,
    maxWidth: 520,
    marginBottom: 40,
  },

  // Sections
  section: {
    padding: '52px 72px',
    background: '#1D232F',
  },
  sectionInner: {
    maxWidth: 1020,
    margin: '0 auto',
  },
  label: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '.12em',
    textTransform: 'uppercase',
    color: '#71A1F4',
    background: 'rgba(39,112,239,.12)',
    borderRadius: 100,
    padding: '5px 14px',
    marginBottom: 18,
  },
  h2: {
    fontSize: 'clamp(24px, 2.8vw, 38px)',
    fontWeight: 800,
    letterSpacing: '-.025em',
    lineHeight: 1.15,
    marginBottom: 8,
  },
  sub: {
    fontSize: 15.5,
    color: 'rgba(255,255,255,.46)',
    lineHeight: 1.65,
    marginBottom: 32,
    maxWidth: 560,
  },

  // Pipeline
  pipelineWrap: {
    background: 'rgba(255,255,255,.03)',
    border: '1px solid rgba(255,255,255,.08)',
    borderRadius: 24,
    padding: '40px 40px 32px',
  },

  // Branches
  branchGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 11,
    marginBottom: 28,
  },
  branchCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '18px 20px',
    background: 'rgba(255,255,255,.045)',
    border: '1px solid rgba(255,255,255,.08)',
    borderRadius: 16,
    transition: 'all .2s',
    cursor: 'default',
  },
  branchEmoji: {
    width: 38,
    height: 38,
    borderRadius: 11,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    flexShrink: 0,
  },
  branchInput: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 3,
  },
  branchRoute: {
    fontSize: 12,
    color: 'rgba(255,255,255,.38)',
    fontFamily: '"SF Mono", "Fira Code", monospace',
  },
  branchDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },

  // Routing illustration
  routingIllustration: {
    background: 'rgba(255,255,255,.03)',
    border: '1px solid rgba(255,255,255,.08)',
    borderRadius: 24,
    padding: '40px 40px 32px',
    marginTop: 28,
  },

  // Priority files
  priorityGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 16,
  },
  priorityCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    padding: '18px 20px',
    background: 'rgba(255,255,255,.04)',
    border: '1px solid rgba(255,255,255,.08)',
    borderRadius: 16,
    transition: 'all .2s',
  },
  priorityNum: {
    width: 30,
    height: 30,
    borderRadius: 9,
    background: 'rgba(39,112,239,.12)',
    border: '1.5px solid rgba(39,112,239,.25)',
    color: '#ABC7F9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 800,
    flexShrink: 0,
  },
  priorityFile: {
    fontSize: 13,
    fontWeight: 700,
    fontFamily: '"SF Mono", "Fira Code", monospace',
    marginBottom: 2,
  },
  priorityRole: {
    fontSize: 11,
    fontWeight: 700,
    color: '#71A1F4',
    letterSpacing: '.04em',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  priorityDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,.42)',
    lineHeight: 1.55,
  },

  // Reuse
  reuseGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 16,
    marginBottom: 28,
  },
  reuseCard: {
    background: 'rgba(255,255,255,.04)',
    border: '1px solid rgba(255,255,255,.08)',
    borderRadius: 24,
    padding: '28px 26px',
    transition: 'all .22s',
    display: 'flex',
    flexDirection: 'column',
  },
  reuseEmoji: {
    fontSize: 26,
    marginBottom: 12,
  },
  reuseTitle: {
    fontSize: 17,
    fontWeight: 800,
    marginBottom: 10,
  },
  reuseDesc: {
    fontSize: 13.5,
    color: 'rgba(255,255,255,.45)',
    lineHeight: 1.6,
    marginBottom: 18,
    flex: 1,
  },
  reuseTag: {
    display: 'inline-block',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '.1em',
    textTransform: 'uppercase',
    padding: '3px 10px',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },

  // Reuse illustration
  reuseIllustration: {
    background: 'rgba(255,255,255,.03)',
    border: '1px solid rgba(255,255,255,.08)',
    borderRadius: 24,
    padding: '28px 24px',
    marginBottom: 24,
  },

  // Note
  noteCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '16px 20px',
    background: 'rgba(39,112,239,.08)',
    border: '1px solid rgba(39,112,239,.18)',
    borderRadius: 16,
    fontSize: 13,
    color: 'rgba(255,255,255,.6)',
    lineHeight: 1.6,
  },
  noteCardCentered: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '18px 24px',
    background: 'rgba(255,255,255,.04)',
    border: '1px solid rgba(255,255,255,.08)',
    borderRadius: 24,
    fontSize: 14,
    color: 'rgba(255,255,255,.55)',
    lineHeight: 1.65,
    textAlign: 'left',
    marginBottom: 36,
    maxWidth: 620,
    margin: '0 auto 36px',
  },

  // Inline code
  inlineCode: {
    fontFamily: '"SF Mono", "Fira Code", monospace',
    fontSize: 12,
    fontWeight: 500,
    color: '#71A1F4',
    background: 'rgba(39,112,239,.1)',
    padding: '2px 6px',
    borderRadius: 5,
  },

  // CTA
  cta: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    fontFamily: '"Inter", system-ui, sans-serif',
    fontSize: 16,
    fontWeight: 700,
    color: '#fff',
    background: 'linear-gradient(135deg, #2770EF 0%, #163772 100%)',
    border: 'none',
    borderRadius: 14,
    padding: '16px 36px',
    cursor: 'pointer',
    transition: 'all .22s',
    boxShadow: '0 6px 24px rgba(39,112,239,.4)',
    textDecoration: 'none',
  },
};

export default HowItWorksPage;
