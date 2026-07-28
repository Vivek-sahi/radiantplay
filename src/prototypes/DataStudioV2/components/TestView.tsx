import React, { useEffect, useRef, useState } from 'react';
import { ff } from '../styles';
import { Icon } from '../../../components/icons';
import { MOCK_PLAN_BASE } from './AgentPanel';
import type { TestFixItem } from './TestFixCard';
import EvalView from './EvalView';

// ── Test view — requirements-driven model testing ─────────────────────────────
// One question at a time from the requirements doc. Exact (deterministic) answer
// first, then opt-in "View Spotter's answer" for side-by-side comparison. Pin
// passing tests to build a ground-truth suite. After model edits, stale tests
// show a scoped re-check offer. Run-all lives only in publish pre-flight.

const BORDER = '1px solid #EAEDF2';
const FONT = ff.primary;

type QuestionStatus = 'untested' | 'passing' | 'failing' | 'stale' | 'pinned';

export interface TestTable {
  name: string;
  cols: [string, string][];
}

interface TestViewProps {
  tables: TestTable[];
  onModelEdit?: () => void;
  // "Fix issues with AI" — hands the divergence-based fix items to the shell's
  // chat so the agent can reason and show fix recommendations.
  onFixWithAI?: (items: TestFixItem[]) => void;
}

// Fix recommendations per question, tied to the exact divergence Spotter showed
const FIX_ITEMS: Record<string, TestFixItem[]> = {
  roas: [
    {
      id: 'attribution-window',
      title: 'Pin revenue to order-date attribution',
      detail: "Spotter counted post-click attribution revenue for Highland Display ($58,200 vs the exact $56,500).",
      fix: 'Added a model instruction: attribute revenue on order date, not click date.',
      layer: 'Semantic',
    },
  ],
  segments: [
    {
      id: 'exposure-filter',
      title: 'Remove the low-exposure segment filter',
      detail: "Spotter dropped the 'Unclassified' segment (18 exposures) using an implicit <20 minimum.",
      fix: 'Cleared the exposure threshold so every segment is returned.',
      layer: 'Logical',
    },
    {
      id: 'unclassified-desc',
      title: "Describe the 'Unclassified' segment",
      detail: "No description on the null-segment group, so Spotter treated it as noise.",
      fix: "Added AI context: null segment = users with no CRM classification, keep as a distinct group.",
      layer: 'Semantic',
    },
  ],
};

// Fallback so "See recommended fix" always has something to reason about
const GENERIC_FIX: TestFixItem[] = [
  {
    id: 'generic-context',
    title: 'Add context for this question',
    detail: 'The model is missing metadata Spotter needs to answer this precisely.',
    fix: 'Added a column description and synonyms so Spotter maps the question correctly.',
    layer: 'Semantic',
  },
];

// Thumbs-down reasons — shared across both answers
const FB_REASONS = ['Numbers look wrong', 'Wrong columns used', 'Wrong time period', 'Rows missing', 'Something else'];

// Generic deterministic result for an ad-hoc token query (no Spotter comparison)
const ADHOC_ANSWER = {
  title: 'Query result',
  cols: ['Region', 'Orders', 'Revenue'],
  rows: [
    ['West', 42, '$88,410'],
    ['North', 35, '$74,220'],
    ['East', 31, '$63,180'],
    ['South', 26, '$52,940'],
    ['APAC', 16, '$31,560'],
  ] as (string | number)[][],
  chartLabelIdx: 0,
  chartValueIdx: 2,
  chartValueLabel: 'Revenue',
};

// Detect whether the query-bar text is a natural-language question (vs tokens)
const QUESTION_STARTERS = /^(what|which|how|show|why|when|where|who|list|find|give|tell|compare|average|total|count|do|does|is|are)\b/i;
const isNLQuestion = (t: string) => {
  const s = t.trim();
  if (!s) return false;
  if (s.endsWith('?')) return true;
  if (QUESTION_STARTERS.test(s)) return true;
  return s.split(/\s+/).length >= 5;
};
// Map an NL question to a plausible token query (scripted)
const generateTokensFor = (nl: string): string[] => {
  const s = nl.toLowerCase();
  if (s.includes('roas')) return ['campaign_roas', 'by campaign_name', 'by channel', 'last month'];
  if (s.includes('convert') || s.includes('segment')) return ['conversion_rate', 'by segment', "channel = 'paid_search'"];
  if (s.includes('budget') || s.includes('spend')) return ['spend', 'budget', 'by target_region'];
  if (s.includes('order value') || s.includes('aov')) return ['avg amount', 'by channel'];
  return ['sales', 'by region', 'this quarter'];
};

interface TestQuestion {
  id: string;
  question: string;
  tokens: string[];
  expectedAnswer: {
    title: string;
    cols: string[];
    rows: (string | number)[][];
    chartLabelIdx: number;
    chartValueIdx: number;
    chartValueLabel: string;
  };
  status: QuestionStatus;
  pinned?: boolean;
  memoryNote?: string;
}

const INITIAL_QUESTIONS: TestQuestion[] = [
  {
    id: 'roas',
    question: 'What is the ROAS by campaign and channel last month?',
    tokens: ['campaign_roas', 'by campaign_name', 'by channel', 'last month'],
    expectedAnswer: {
      title: 'ROAS by campaign and channel · last month',
      cols: ['Campaign', 'Channel', 'Spend', 'Revenue', 'ROAS'],
      rows: [
        ['Summer Gear Push', 'paid_search', '$48,200', '$212,080', '4.4×'],
        ['Riders Club Email', 'email', '$12,400', '$50,840', '4.1×'],
        ['Monsoon Social', 'social', '$31,000', '$105,400', '3.4×'],
        ['Highland Display', 'display', '$22,600', '$56,500', '2.5×'],
        ['Trail Week Promo', 'paid_search', '$18,900', '$41,580', '2.2×'],
      ],
      chartLabelIdx: 0,
      chartValueIdx: 4,
      chartValueLabel: 'ROAS',
    },
    status: 'untested',
  },
  {
    id: 'segments',
    question: 'Which user segments convert best for paid search campaigns?',
    tokens: ['conversion_rate', 'by segment', "channel = 'paid_search'"],
    expectedAnswer: {
      title: 'Conversion rate by segment · paid search',
      cols: ['Segment', 'Users exposed', 'Orders', 'Conversion rate'],
      rows: [
        ['Enterprise', 34, 11, '32.4%'],
        ['Mid-market', 41, 9, '22.0%'],
        ['SMB', 52, 8, '15.4%'],
        ['Unclassified', 18, 2, '11.1%'],
      ],
      chartLabelIdx: 0,
      chartValueIdx: 3,
      chartValueLabel: 'Conversion rate',
    },
    status: 'untested',
  },
  {
    id: 'budget',
    question: 'How does ad spend compare to budget across regions?',
    tokens: ['spend', 'budget', 'by target_region'],
    expectedAnswer: {
      title: 'Spend vs budget by target region',
      cols: ['Region', 'Spend', 'Budget', 'Utilisation'],
      rows: [
        ['West', '$61,400', '$60,000', '102%'],
        ['North', '$44,100', '$52,000', '85%'],
        ['East', '$38,700', '$48,000', '81%'],
        ['South', '$27,300', '$40,000', '68%'],
        ['APAC', '$19,800', '$35,000', '57%'],
      ],
      chartLabelIdx: 0,
      chartValueIdx: 3,
      chartValueLabel: 'Budget utilisation',
    },
    status: 'untested',
  },
  {
    id: 'aov',
    question: 'What is the average order value for social vs email campaigns?',
    tokens: ['avg amount', "channel in ('social', 'email')", 'by channel'],
    expectedAnswer: {
      title: 'Average order value · social vs email',
      cols: ['Channel', 'Orders', 'Revenue', 'Avg order value'],
      rows: [
        ['social', 46, '$105,400', '$2,291'],
        ['email', 27, '$50,840', '$1,883'],
      ],
      chartLabelIdx: 0,
      chartValueIdx: 3,
      chartValueLabel: 'Avg order value',
    },
    status: 'untested',
  },
];

const MOCK_SPOTTER_ANSWER = (questionId: string) => {
  const variations: Record<string, { rows: (string | number)[][]; reasoning: string }> = {
    roas: {
      rows: [
        ['Summer Gear Push', 'paid_search', '$48,200', '$212,080', '4.4×'],
        ['Riders Club Email', 'email', '$12,400', '$50,840', '4.1×'],
        ['Monsoon Social', 'social', '$31,000', '$105,400', '3.4×'],
        ['Highland Display', 'display', '$22,600', '$58,200', '2.6×'],
        ['Trail Week Promo', 'paid_search', '$18,900', '$41,580', '2.2×'],
      ],
      reasoning: 'Spotter included post-click attribution window revenue for Highland Display.',
    },
    segments: {
      rows: [
        ['Enterprise', 34, 11, '32.4%'],
        ['Mid-market', 41, 9, '22.0%'],
        ['SMB', 52, 8, '15.4%'],
      ],
      reasoning: 'Spotter filtered out segments with fewer than 20 exposures.',
    },
  };
  return variations[questionId] || null;
};

const parseNum = (v: string | number): number => {
  if (typeof v === 'number') return v;
  const n = parseFloat(v.replace(/[$,%×]/g, '').replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
};

const COL_TYPE_KIND = (type: string): 'measure' | 'attribute' | 'date' => {
  if (type === 'DATE' || type === 'TIMESTAMP') return 'date';
  if (type === 'INT' || type === 'FLOAT') return 'measure';
  return 'attribute';
};

const KIND_ICON: Record<string, React.ReactNode> = {
  measure: <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2 12V7M7 12V2M12 12V5" stroke="#2770EF" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  attribute: <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="2.5" width="11" height="9" rx="1.5" stroke="#8B96A5" strokeWidth="1.2"/><path d="M1.5 5.5h11" stroke="#8B96A5" strokeWidth="1.2"/></svg>,
  date: <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="2.5" width="11" height="10" rx="1.5" stroke="#8B96A5" strokeWidth="1.2"/><path d="M1.5 5.5h11M4.5 1.5v2M9.5 1.5v2" stroke="#8B96A5" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  formula: <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M5 3c0-1 1.3-1 1.7 0v1.5c0 .5.4 1 .9 1" stroke="#7C3AED" strokeWidth="1.2" strokeLinecap="round"/><path d="M6.5 5v6" stroke="#7C3AED" strokeWidth="1.2" strokeLinecap="round"/><path d="M4.5 7.5h4.5" stroke="#7C3AED" strokeWidth="1.2" strokeLinecap="round"/></svg>,
};


const TestView: React.FC<TestViewProps> = ({ tables, onFixWithAI }) => {
  const [questions, setQuestions] = useState<TestQuestion[]>(INITIAL_QUESTIONS);
  const [currentIdx, setCurrentIdx] = useState(-1); // -1 = nothing selected (empty state)
  const currentQ = questions[currentIdx] ?? questions[0]; // safe placeholder while unselected

  const [tokens, setTokens] = useState<string[]>([]);
  const [draft, setDraft] = useState('');

  const [exactAnswer, setExactAnswer] = useState<typeof currentQ.expectedAnswer | null>(null);
  const [loading, setLoading] = useState(false);
  const loadingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [resultMode, setResultMode] = useState<'table' | 'chart'>('table');

  const [spotterShown, setSpotterShown] = useState(false);
  const [spotterLoading, setSpotterLoading] = useState(false);
  const spotterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [spotterAnswer, setSpotterAnswer] = useState<{ rows: (string | number)[][]; reasoning: string } | null>(null);

  const [memoryModalOpen, setMemoryModalOpen] = useState(false);
  const [memoryNote, setMemoryNote] = useState('');
  const [notWhatIMeantOpen, setNotWhatIMeantOpen] = useState(false);
  const [wrongAnswerOpen, setWrongAnswerOpen] = useState(false);
  const [wrongAnswerReason, setWrongAnswerReason] = useState('');

  // Where the current answer came from — gates the Compare-with-Spotter option.
  // 'question' = sample or added NL question (compare makes sense);
  // 'adhoc' = raw token/column query (deterministic answer only, no compare).
  const [answerSource, setAnswerSource] = useState<'question' | 'adhoc' | null>(null);
  // Set when the current token query was generated from an NL question typed in
  // the bar — makes the next Run a "question" run (Compare with Spotter appears).
  const [queryFromNL, setQueryFromNL] = useState(false);

  // Shared feedback per answer surface (exact search-data answer + Spotter answer)
  const [fb, setFb] = useState<Record<'exact' | 'spotter', { verdict: 'up' | 'down' | 'oos' | null; reason: string | null }>>({
    exact: { verdict: null, reason: null },
    spotter: { verdict: null, reason: null },
  });
  const resetFeedback = () => setFb({ exact: { verdict: null, reason: null }, spotter: { verdict: null, reason: null } });
  const setVerdict = (key: 'exact' | 'spotter', v: 'up' | 'down' | 'oos') =>
    setFb(prev => ({ ...prev, [key]: { verdict: prev[key].verdict === v ? null : v, reason: v === 'down' ? prev[key].reason : null } }));
  const setReason = (key: 'exact' | 'spotter', r: string) =>
    setFb(prev => ({ ...prev, [key]: { ...prev[key], reason: prev[key].reason === r ? null : r } }));

  const staleCount = questions.filter(q => q.status === 'stale').length;
  const [stalePromptDismissed, setStalePromptDismissed] = useState(false);

  const [colSearch, setColSearch] = useState('');
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['formulas', 'measures']));
  const [questionMenuOpen, setQuestionMenuOpen] = useState(false);

  const [evalDone, setEvalDone] = useState(false);
  // Independent expand/collapse for the two test cards; both collapsed on landing
  const [evalOpen, setEvalOpen] = useState(false);
  const [tuneOpen, setTuneOpen] = useState(false);

  const runExactQuery = () => {
    if (loading) return;
    const runTokens = draft.trim() ? [...tokens, draft.trim()] : tokens;
    setTokens(runTokens);
    setDraft('');
    const isQuestion = currentIdx >= 0 || queryFromNL;
    setLoading(true);
    setExactAnswer(null);
    setSpotterShown(false);
    setSpotterAnswer(null);
    resetFeedback();
    if (loadingTimer.current) clearTimeout(loadingTimer.current);
    loadingTimer.current = setTimeout(() => {
      setExactAnswer(currentIdx >= 0 ? currentQ.expectedAnswer : ADHOC_ANSWER);
      setAnswerSource(isQuestion ? 'question' : 'adhoc');
      setResultMode('table');
      setLoading(false);
      if (isQuestion) setQuestions(prev => prev.map((q, i) => i === currentIdx ? { ...q, status: 'passing' } : q));
    }, 1100);
  };

  const viewSpotterAnswer = () => {
    setSpotterShown(true);
    setSpotterLoading(true);
    if (spotterTimer.current) clearTimeout(spotterTimer.current);
    spotterTimer.current = setTimeout(() => {
      let mockAnswer = MOCK_SPOTTER_ANSWER(currentQ.id);
      // Fallback divergence for questions without a scripted variation (budget,
      // AOV, added NL questions): nudge the last metric cell on the first row.
      if (!mockAnswer && exactAnswer) {
        const rows = exactAnswer.rows.map(r => [...r]);
        if (rows[0]) {
          const j = exactAnswer.cols.length - 1;
          const n = parseNum(rows[0][j]);
          if (n) rows[0][j] = String(rows[0][j]).replace(String(Math.round(n)), String(Math.round(n * 1.08)));
        }
        mockAnswer = { rows, reasoning: 'Spotter interpreted the question slightly differently on one row.' };
      }
      setSpotterAnswer(mockAnswer);
      setSpotterLoading(false);
    }, 1400);
  };

  const goToQuestion = (idx: number) => {
    setCurrentIdx(idx);
    const q = questions[idx];
    setTokens(q.tokens);
    setDraft('');
    setExactAnswer(null);
    setSpotterShown(false);
    setSpotterAnswer(null);
    setAnswerSource(null);
    setQueryFromNL(false);
    setResultMode('table');
    resetFeedback();
  };
  const passingCount = questions.filter(q => q.status === 'passing' || q.status === 'pinned').length;

  // Add a question (sample-list "New question" entry, or a typed NL question).
  // Both are treated as questions → deterministic answer + Compare with Spotter.
  const addQuestion = (title?: string) => {
    const id = `custom-${Date.now()}`;
    const nq: TestQuestion = {
      id,
      question: title && title.trim() ? title.trim() : 'New question',
      tokens: [],
      expectedAnswer: { title: title && title.trim() ? title.trim() : 'Custom query result', cols: ['Region', 'Orders', 'Revenue'], rows: [['West', 42, '$88,410'], ['North', 35, '$74,220'], ['East', 31, '$63,180'], ['South', 26, '$52,940']], chartLabelIdx: 0, chartValueIdx: 2, chartValueLabel: 'Revenue' },
      status: 'untested',
    };
    const newIdx = questions.length;
    setQuestions(prev => [...prev, nq]);
    setCurrentIdx(newIdx);
    setTokens([]);
    setDraft('');
    setExactAnswer(null);
    setSpotterShown(false);
    setSpotterAnswer(null);
    setAnswerSource(null);
    setResultMode('table');
  };
  const [askDraft, setAskDraft] = useState('');
  const askQuestion = () => {
    if (!askDraft.trim()) return;
    addQuestion(askDraft.trim());
    setAskDraft('');
  };
  const updateCurrentTitle = (title: string) => {
    setQuestions(prev => prev.map((q, i) => i === currentIdx ? { ...q, question: title } : q));
  };

  const handleAddToMemory = () => {
    setQuestions(prev => prev.map((q, i) => i === currentIdx ? { ...q, memoryNote } : q));
    setMemoryModalOpen(false);
    setMemoryNote('');
  };
  const handlePin = () => {
    setQuestions(prev => prev.map((q, i) => i === currentIdx ? { ...q, status: 'pinned', pinned: true } : q));
  };
  const handleFixWithAI = () => {
    alert('Fix with AI would open agent panel with context');
    setWrongAnswerOpen(false);
  };

  const addToken = (t: string) => {
    setTokens(prev => (prev.includes(t) ? prev : [...prev, t]));
  };
  const removeToken = (t: string) => {
    setTokens(prev => prev.filter(x => x !== t));
  };
  const clearAll = () => {
    setTokens([]);
    setDraft('');
    setQueryFromNL(false);
  };
  // NL question typed in the query bar → register it as a named question in the
  // picker, generate its token query, and select it (so Compare applies on Run).
  const generateQuery = () => {
    const text = draft.trim();
    if (!text) return;
    const toks = generateTokensFor(text);
    const nq: TestQuestion = {
      id: `custom-${Date.now()}`,
      question: text,
      tokens: toks,
      expectedAnswer: { ...ADHOC_ANSWER, title: text },
      status: 'untested',
    };
    const newIdx = questions.length;
    setQuestions(prev => [...prev, nq]);
    setCurrentIdx(newIdx);
    setTokens(toks);
    setDraft('');
    setQueryFromNL(true);
    setExactAnswer(null);
    setAnswerSource(null);
    setSpotterShown(false);
    setSpotterAnswer(null);
    resetFeedback();
  };

  useEffect(() => () => {
    if (loadingTimer.current) clearTimeout(loadingTimer.current);
    if (spotterTimer.current) clearTimeout(spotterTimer.current);
  }, []);

  useEffect(() => {
    setTokens(currentIdx >= 0 ? currentQ.tokens : []);
    setDraft('');
  }, [currentIdx]);

  const grouped: Record<'measure' | 'attribute' | 'date', { col: string; table: string }[]> = { measure: [], attribute: [], date: [] };
  tables.forEach(t => t.cols.forEach(([col, type]) => {
    if (colSearch && !col.toLowerCase().includes(colSearch.toLowerCase())) return;
    grouped[COL_TYPE_KIND(type)].push({ col, table: t.name });
  }));

  const toggleSection = (s: string) => setOpenSections(prev => {
    const next = new Set(prev);
    if (next.has(s)) next.delete(s); else next.add(s);
    return next;
  });

  const sectionHeader = (id: string, label: string, count: number) => (
    <button
      onClick={() => toggleSection(id)}
      style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '7px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: FONT, textAlign: 'left' }}
    >
      <svg width="9" height="9" viewBox="0 0 10 10" fill="none" style={{ color: '#8B96A5', transform: openSections.has(id) ? 'rotate(90deg)' : 'none', transition: 'transform 120ms' }}><path d="M3.5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', flex: 1 }}>{label}</span>
      <span style={{ fontSize: 10, color: '#BFC6D0', fontWeight: 600 }}>{count}</span>
    </button>
  );

  const colRow = (col: string, kind: string, table?: string) => (
    <button
      key={`${table ?? 'formula'}-${col}`}
      onClick={() => addToken(col)}
      title={table ? `${table}.${col} — click to add to query` : `${col} — click to add to query`}
      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '5px 12px 5px 27px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: FONT, textAlign: 'left' }}
      onMouseEnter={e => { e.currentTarget.style.background = '#F6F8FA'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ flexShrink: 0, display: 'flex' }}>{KIND_ICON[kind]}</span>
      <span style={{ fontSize: 12, color: '#1D232F', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{col}</span>
      {table && <span style={{ fontSize: 9.5, color: '#C0C6CF', fontWeight: 500, flexShrink: 0 }}>{table}</span>}
    </button>
  );

  const renderChart = (data: { rows: (string | number)[][]; chartLabelIdx: number; chartValueIdx: number; chartValueLabel: string }) => {
    const values = data.rows.map(r => parseNum(r[data.chartValueIdx]));
    const max = Math.max(...values, 1);
    return (
      <div style={{ padding: '18px 20px 10px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data.rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 130, fontSize: 12, color: '#4B5563', fontWeight: 500, textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(r[data.chartLabelIdx])}</span>
            <div style={{ flex: 1, height: 22, background: '#F6F8FA', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${(values[i] / max) * 100}%`, height: '100%', background: '#2770EF', borderRadius: 4, opacity: 0.9 - i * 0.08, transition: 'width 400ms cubic-bezier(0.4,0,0.2,1)' }} />
            </div>
            <span style={{ width: 76, fontSize: 12, color: '#1D232F', fontWeight: 600, flexShrink: 0 }}>{String(r[data.chartValueIdx])}</span>
          </div>
        ))}
        <div style={{ fontSize: 10.5, color: '#8B96A5', paddingLeft: 142 }}>{data.chartValueLabel}</div>
      </div>
    );
  };

  const statusIcon = (status: QuestionStatus) => {
    switch (status) {
      case 'passing':
        return <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="#06BF7F" fillOpacity="0.12" /><path d="M5 8l2 2 4-4" stroke="#06BF7F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
      case 'failing':
        return <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="#E5484D" fillOpacity="0.1" /><path d="M6 6l4 4M10 6l-4 4" stroke="#E5484D" strokeWidth="1.5" strokeLinecap="round"/></svg>;
      case 'stale':
        return <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="#F59E0B" fillOpacity="0.1" /><path d="M8 5v3.5M8 11v.5" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round"/></svg>;
      case 'pinned':
        return <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="#7C3AED" fillOpacity="0.1" /><path d="M5 8l2 2 4-4" stroke="#7C3AED" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
      default:
        return <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#C0C6CF" strokeWidth="1.3" /></svg>;
    }
  };

  // Shared feedback bar — same across the exact answer and Spotter's answer
  const renderFeedback = (key: 'exact' | 'spotter') => {
    const f = fb[key];
    const thumb = (v: 'up' | 'down', active: boolean) => (
      <button
        onClick={() => setVerdict(key, v)}
        title={v === 'up' ? 'Correct' : 'Incorrect'}
        style={{ width: 28, height: 28, border: 'none', borderRadius: 7, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? (v === 'up' ? 'rgba(6,191,127,0.12)' : 'rgba(229,72,77,0.10)') : 'transparent' }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#F0F2F6'; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
      >
        <Icon name={v === 'up' ? 'thumb-up' : 'thumb-down'} size="s" color={active ? (v === 'up' ? '#06BF7F' : '#E5484D') : '#8B96A5'} />
      </button>
    );
    const oosActive = f.verdict === 'oos';
    // On the Spotter answer, count cells that diverge from the exact answer
    const diffCount = (key === 'spotter' && spotterAnswer && exactAnswer)
      ? spotterAnswer.rows.reduce((n, r, i) => n + r.reduce((m, cell, j) => {
          const ec = exactAnswer.rows[i]?.[j];
          return m + (ec !== undefined && String(cell) !== String(ec) ? 1 : 0);
        }, 0), 0)
      : 0;
    return (
      <div style={{ padding: '9px 14px', borderTop: BORDER }}>
        {diffCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '9px 11px', borderRadius: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: '#B8860B' }}><path d="M8 1.5l6.5 11.5H1.5L8 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M8 6.5v3M8 11v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
            <span style={{ flex: 1, fontSize: 11.5, color: '#8A6D1A', lineHeight: 1.5 }}>
              Spotter diverges from the exact answer on {diffCount} value{diffCount === 1 ? '' : 's'}.
            </span>
            <button
              onClick={() => onFixWithAI?.(FIX_ITEMS[currentQ.id] ?? GENERIC_FIX)}
              style={{ height: 28, padding: '0 12px', borderRadius: 6, border: 'none', background: '#2770EF', color: '#fff', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.background = '#2359B6'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#2770EF'; }}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 1l1.9 4.4L14 6l-3 3 .8 4.8L8 11.6 4.2 13.8 5 9 2 6l4.1-.6L8 1z" fill="currentColor"/></svg>
              Check recommended fixes
            </button>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11.5, color: '#8B96A5', marginRight: 3 }}>Was this correct?</span>
          {thumb('up', f.verdict === 'up')}
          {thumb('down', f.verdict === 'down')}
          <button
            onClick={() => setVerdict(key, 'oos')}
            style={{ height: 26, padding: '0 11px', borderRadius: 99, cursor: 'pointer', fontFamily: FONT, fontSize: 11.5, fontWeight: 600, border: `1px solid ${oosActive ? '#C0C6CF' : '#E2E6EC'}`, background: oosActive ? '#F0F2F6' : '#fff', color: oosActive ? '#4B5563' : '#8B96A5', transition: 'all 120ms' }}
          >
            Out of scope
          </button>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => setMemoryModalOpen(true)}
            title="Add this answer to the model's memory"
            style={{ height: 26, padding: '0 11px', borderRadius: 6, cursor: 'pointer', fontFamily: FONT, fontSize: 11.5, fontWeight: 600, border: `1px solid #E2E6EC`, background: '#fff', color: '#4B5563', display: 'flex', alignItems: 'center', gap: 6, transition: 'border-color 120ms, background 120ms' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#2770EF'; e.currentTarget.style.background = '#F5F8FF'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E6EC'; e.currentTarget.style.background = '#fff'; }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 2.5c2.2 0 4 1.6 4 3.7 0 .9-.3 1.7-.9 2.4.3.4.5.9.5 1.4 0 1.3-1.2 2.3-2.7 2.3-.3 0-.6 0-.9-.1-.3.5-.9.8-1.6.8-1 0-1.9-.7-1.9-1.7v-.2c-1.3-.3-2.1-1.3-2.1-2.5 0-.5.1-.9.4-1.3C4.3 8.7 4 7.9 4 7c0-2.1 1.8-3.7 4-3.7z" stroke="#8257C9" strokeWidth="1.2" strokeLinejoin="round"/><path d="M8 5.5v5" stroke="#8257C9" strokeWidth="1.1" strokeLinecap="round"/></svg>
            Add to memory
          </button>
        </div>
        {f.verdict === 'down' && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #F3F5F8' }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: '#1D232F', marginBottom: 8 }}>What&rsquo;s wrong?</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 11 }}>
              {FB_REASONS.map(r => {
                const active = f.reason === r;
                return (
                  <button
                    key={r}
                    onClick={() => setReason(key, r)}
                    style={{ padding: '4px 11px', borderRadius: 99, cursor: 'pointer', fontFamily: FONT, fontSize: 11.5, fontWeight: 500, whiteSpace: 'nowrap', border: `1px solid ${active ? '#2770EF' : '#E2E6EC'}`, background: active ? '#2770EF' : '#fff', color: active ? '#fff' : '#4B5563', transition: 'all 120ms' }}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => onFixWithAI?.(FIX_ITEMS[currentQ.id] ?? GENERIC_FIX)}
              disabled={!f.reason}
              style={{ height: 30, padding: '0 14px', borderRadius: 6, border: 'none', background: f.reason ? '#2770EF' : '#EAEDF2', color: f.reason ? '#fff' : '#A5ACB9', fontSize: 12, fontWeight: 600, cursor: f.reason ? 'pointer' : 'default', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 6 }}
              onMouseEnter={e => { if (f.reason) e.currentTarget.style.background = '#2359B6'; }}
              onMouseLeave={e => { if (f.reason) e.currentTarget.style.background = '#2770EF'; }}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 1l1.9 4.4L14 6l-3 3 .8 4.8L8 11.6 4.2 13.8 5 9 2 6l4.1-.6L8 1z" fill="currentColor"/></svg>
              See recommended fix
            </button>
          </div>
        )}
      </div>
    );
  };

  const tuneSurface = (
    <div style={{ flex: 1, display: 'flex', minHeight: 0, fontFamily: FONT }}>
      {/* Search-data container — always the same interface; picker lives in the results area when unselected */}
      <div style={{ flex: 1, minWidth: 0, minHeight: 0, padding: 16, display: 'flex' }}>
        <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', background: '#fff', border: BORDER, borderRadius: 12, boxShadow: '0 1px 4px rgba(25,35,49,0.05)', overflow: 'hidden' }}>
          {/* Container header — question switcher (dropdown) */}
          <div style={{ position: 'relative', padding: '11px 16px', borderBottom: BORDER, display: 'flex', alignItems: 'center', gap: 11, flexShrink: 0 }}>
            <span style={{ flexShrink: 0, display: 'flex' }}>{statusIcon(currentIdx < 0 ? 'untested' : currentQ.status)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: '#BFC6D0', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" style={{ color: '#BFC6D0' }}><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.6"/><path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                Search data
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                {currentIdx < 0 ? (
                  <button
                    onClick={() => setQuestionMenuOpen(o => !o)}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: FONT, minWidth: 0, textAlign: 'left' }}
                  >
                    <span style={{ fontSize: 14.5, fontWeight: 600, color: '#8B96A5' }}>Pick a question</span>
                  </button>
                ) : currentQ.id.startsWith('custom-') ? (
                  <input
                    value={currentQ.question}
                    onChange={e => updateCurrentTitle(e.target.value)}
                    placeholder="Name this question"
                    style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: 14.5, fontWeight: 600, color: '#1D232F', fontFamily: FONT }}
                  />
                ) : (
                  <button
                    onClick={() => setQuestionMenuOpen(o => !o)}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: FONT, minWidth: 0, textAlign: 'left' }}
                  >
                    <span style={{ fontSize: 14.5, fontWeight: 600, color: '#1D232F', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentQ.question}</span>
                  </button>
                )}
                {/* Switcher toggle */}
                <button
                  onClick={() => setQuestionMenuOpen(o => !o)}
                  title="Switch question"
                  style={{ width: 22, height: 22, flexShrink: 0, border: 'none', borderRadius: 5, background: questionMenuOpen ? '#EEF2FF' : 'transparent', color: questionMenuOpen ? '#2770EF' : '#8B96A5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                  onMouseEnter={e => { if (!questionMenuOpen) e.currentTarget.style.background = '#F0F2F6'; }}
                  onMouseLeave={e => { if (!questionMenuOpen) e.currentTarget.style.background = 'transparent'; }}
                >
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ transform: questionMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 120ms' }}><path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            </div>
            {currentIdx >= 0 && <span style={{ flexShrink: 0, fontSize: 11.5, fontWeight: 500, color: '#8B96A5' }}>{currentIdx + 1} of {questions.length}</span>}

            {/* Question dropdown */}
            {questionMenuOpen && (
              <>
                <div onClick={() => setQuestionMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                <div style={{ position: 'absolute', top: 'calc(100% - 4px)', left: 16, width: 400, maxWidth: 'calc(100% - 32px)', background: '#fff', border: '1px solid #E2E6EC', borderRadius: 10, boxShadow: '0 10px 32px rgba(25,35,49,0.16)', zIndex: 50, overflow: 'hidden' }}>
                  <div style={{ padding: '11px 14px 9px', borderBottom: BORDER, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: '#1D232F' }}>Questions</span>
                    <span style={{ fontSize: 11, color: '#8B96A5' }}>{passingCount} of {questions.length} passing</span>
                  </div>
                  {staleCount > 0 && !stalePromptDismissed && (
                    <div style={{ padding: '8px 14px', borderBottom: BORDER, background: '#FFF9F0', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ flex: 1, fontSize: 11, color: '#8A6D1A' }}>Model changed — {staleCount} question{staleCount > 1 ? 's' : ''} may differ.</span>
                      <button
                        onClick={() => { setQuestions(prev => prev.map(q => q.status === 'stale' ? { ...q, status: 'passing' } : q)); setStalePromptDismissed(true); }}
                        style={{ height: 24, padding: '0 10px', border: 'none', borderRadius: 5, background: '#F59E0B', color: '#fff', fontSize: 10.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, flexShrink: 0 }}
                      >
                        Re-check
                      </button>
                    </div>
                  )}
                  <div style={{ maxHeight: 300, overflowY: 'auto', padding: '4px 0' }}>
                    {questions.map((q, idx) => {
                      const isActive = idx === currentIdx;
                      return (
                        <button
                          key={q.id}
                          onClick={() => { goToQuestion(idx); setQuestionMenuOpen(false); }}
                          style={{ display: 'flex', alignItems: 'flex-start', gap: 9, width: '100%', padding: '9px 14px', border: 'none', background: isActive ? 'rgba(39,112,239,0.06)' : 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: FONT }}
                          onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#F6F8FA'; }}
                          onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isActive ? 'rgba(39,112,239,0.06)' : 'transparent'; }}
                        >
                          <span style={{ flexShrink: 0, marginTop: 1 }}>{statusIcon(q.status)}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12.5, fontWeight: isActive ? 600 : 500, color: isActive ? '#1B58D4' : '#1D232F', lineHeight: 1.4, marginBottom: 1 }}>{q.question}</div>
                            <div style={{ fontSize: 10.5, color: '#8B96A5' }}>
                              {q.status === 'untested' && 'Not tested'}
                              {q.status === 'passing' && 'Passing'}
                              {q.status === 'failing' && 'Failing'}
                              {q.status === 'stale' && 'Stale'}
                              {q.status === 'pinned' && 'Pinned'}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => { addQuestion(); setQuestionMenuOpen(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', border: 'none', borderTop: BORDER, background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: FONT, color: '#2770EF', fontSize: 12.5, fontWeight: 600 }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#F6F8FA'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1.5v9M1.5 6h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                    New question
                  </button>
                </div>
              </>
            )}
          </div>
          {/* Body: model columns + query/results */}
          <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
            {/* Model columns (kept) */}
            <aside style={{ width: 232, flexShrink: 0, background: '#FCFCFD', borderRight: BORDER, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ padding: '11px 12px 9px', borderBottom: BORDER, flexShrink: 0 }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: '#1D232F', marginBottom: 7 }}>Model columns</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, height: 28, background: '#fff', border: BORDER, borderRadius: 6, padding: '0 10px' }}>
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" style={{ color: '#C0C6CF', flexShrink: 0 }}><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/><path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  <input
                    value={colSearch}
                    onChange={e => setColSearch(e.target.value)}
                    placeholder="Find a column..."
                    style={{ border: 'none', background: 'transparent', fontSize: 12, color: '#1D232F', outline: 'none', flex: 1, minWidth: 0, fontFamily: FONT }}
                  />
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0 12px' }}>
                {(['measure', 'attribute', 'date'] as const).map(kind => {
                  const items = grouped[kind];
                  if (items.length === 0) return null;
                  const label = kind === 'measure' ? 'Measures' : kind === 'attribute' ? 'Attributes' : 'Dates';
                  return (
                    <React.Fragment key={kind}>
                      {sectionHeader(`${kind}s`, label, items.length)}
                      {openSections.has(`${kind}s`) && items.map(({ col, table }) => colRow(col, kind, table))}
                    </React.Fragment>
                  );
                })}
              </div>
            </aside>
            {/* Query bar + results column */}
            <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>

          {/* Token query bar */}
          <div style={{ padding: '16px 20px', flexShrink: 0, background: '#F9FAFB' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, minHeight: 40, background: '#fff',
              border: BORDER, borderRadius: 7, boxShadow: '0 1px 3px rgba(25,35,49,0.04)',
              padding: '5px 6px 5px 12px',
            }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', minWidth: 0 }}>
                {tokens.map(t => (
                  <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 500, padding: '3px 8px', borderRadius: 5, background: '#EEF2FF', color: '#1B58D4', border: '1px solid rgba(39,112,239,0.18)', whiteSpace: 'nowrap' }}>
                    {t}
                    <button
                      onClick={() => removeToken(t)}
                      style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', display: 'flex', color: '#71A1F4' }}
                      aria-label={`Remove ${t}`}
                    >
                      <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                    </button>
                  </span>
                ))}
                <input
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && draft.trim()) {
                      e.preventDefault();
                      if (isNLQuestion(draft)) { generateQuery(); }
                      else { addToken(draft.trim()); setDraft(''); }
                    } else if (e.key === 'Backspace' && draft === '' && tokens.length > 0) {
                      setTokens(prev => prev.slice(0, -1));
                    }
                  }}
                  placeholder={tokens.length === 0 ? (currentIdx < 0 ? 'Ask a question, or type columns to search…' : 'Edit tokens or add new ones') : ''}
                  style={{ flex: 1, minWidth: 100, border: 'none', background: 'transparent', outline: 'none', fontSize: 12, color: '#1D232F', fontFamily: FONT, padding: '3px 0' }}
                />
              </div>
              {tokens.length > 0 && (
                <button onClick={clearAll} title="Clear all" style={{ width: 24, height: 24, border: 'none', background: 'transparent', borderRadius: 5, color: '#BFC6D0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }}>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                </button>
              )}
              {isNLQuestion(draft) ? (
                <button
                  onClick={generateQuery}
                  disabled={loading}
                  style={{ height: 28, padding: '0 13px', borderRadius: 6, border: 'none', background: '#2770EF', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#2359B6'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#2770EF'; }}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 1l1.5 4L14 6l-3.2 2.6L11.8 13 8 10.6 4.2 13 5.2 8.6 2 6l4.5-1L8 1z" fill="currentColor"/></svg>
                  Generate query
                </button>
              ) : (
                <button
                  onClick={runExactQuery}
                  disabled={loading || tokens.length === 0}
                  style={{
                    height: 28, padding: '0 14px', borderRadius: 6, border: 'none',
                    background: !loading && tokens.length > 0 ? '#2770EF' : '#EAEDF2',
                    color: !loading && tokens.length > 0 ? '#fff' : '#A5ACB9',
                    fontSize: 12, fontWeight: 600, cursor: !loading && tokens.length > 0 ? 'pointer' : 'default',
                    fontFamily: FONT, flexShrink: 0,
                  }}
                >
                  {loading ? 'Running…' : 'Run'}
                </button>
              )}
            </div>
          </div>

          {/* Results area */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px' }}>
            {(currentIdx < 0 && !exactAnswer && !loading) ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 6px 20px' }}>
                <div style={{ width: '100%', maxWidth: 580 }}>
                  {/* Ask in natural language */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, background: '#fff', border: BORDER, borderRadius: 10, boxShadow: '0 1px 3px rgba(25,35,49,0.04)', padding: '6px 6px 6px 13px' }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ color: '#8B96A5', flexShrink: 0 }}><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/><path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    <input
                      value={askDraft}
                      onChange={e => setAskDraft(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); askQuestion(); } }}
                      placeholder="Ask a question in your own words…"
                      style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: '#1D232F', fontFamily: FONT }}
                    />
                    <button
                      onClick={askQuestion}
                      disabled={!askDraft.trim()}
                      style={{ height: 30, padding: '0 14px', borderRadius: 7, border: 'none', background: askDraft.trim() ? '#2770EF' : '#EAEDF2', color: askDraft.trim() ? '#fff' : '#A5ACB9', fontSize: 12, fontWeight: 600, cursor: askDraft.trim() ? 'pointer' : 'default', fontFamily: FONT, flexShrink: 0 }}
                    >Ask</button>
                  </div>
                  {/* Compact, delightful header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 14 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, rgba(39,112,239,0.12), rgba(124,58,237,0.12))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="6" stroke="#5B6FE0" strokeWidth="1.7"/><path d="M13.5 13.5L17 17" stroke="#5B6FE0" strokeWidth="1.7" strokeLinecap="round"/></svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: '#1D232F', letterSpacing: '-0.2px' }}>Tune your model</div>
                      <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 1 }}>Pick a question to test against the exact answer — or add your own.</div>
                    </div>
                    <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 600, color: '#64748B', background: '#F0F2F6', borderRadius: 99, padding: '3px 10px' }}>{passingCount}/{questions.length} passing</span>
                  </div>
                  {/* Question list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {questions.map((q, idx) => (
                      <button
                        key={q.id}
                        onClick={() => goToQuestion(idx)}
                        style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '10px 13px', border: BORDER, borderRadius: 9, background: '#fff', cursor: 'pointer', textAlign: 'left', fontFamily: FONT, transition: 'border-color 130ms, box-shadow 130ms' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#2770EF'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(39,112,239,0.10)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#EAEDF2'; e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        <span style={{ flexShrink: 0, display: 'flex' }}>{statusIcon(q.status)}</span>
                        <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 500, color: '#1D232F', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.question}</span>
                        <svg width="11" height="11" viewBox="0 0 10 10" fill="none" style={{ color: '#C0C6CF', flexShrink: 0 }}><path d="M3.5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                    ))}
                    <button
                      onClick={() => addQuestion()}
                      style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '10px 13px', border: '1px dashed #C7CDD6', borderRadius: 9, background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: FONT, color: '#2770EF', fontSize: 12.5, fontWeight: 600, transition: 'border-color 130ms, background 130ms' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#2770EF'; e.currentTarget.style.background = '#F5F8FF'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#C7CDD6'; e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span style={{ width: 18, height: 18, borderRadius: 5, background: 'rgba(39,112,239,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 1.5v9M1.5 6h9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
                      </span>
                      New question
                    </button>
                  </div>
                </div>
              </div>
            ) : loading ? (
              <div style={{ background: '#fff', border: BORDER, borderRadius: 9, boxShadow: '0 1px 3px rgba(25,35,49,0.04)', overflow: 'hidden' }}>
                <style>{`@keyframes tv-spin{to{transform:rotate(360deg)}} @keyframes tv-shimmer{0%{opacity:0.55}50%{opacity:1}100%{opacity:0.55}}`}</style>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 16px', borderBottom: BORDER }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ animation: 'tv-spin 700ms linear infinite', flexShrink: 0 }}><path d="M8 1.5a6.5 6.5 0 1 1-6.5 6.5" stroke="#2770EF" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  <span style={{ fontSize: 12.5, fontWeight: 500, color: '#64748B' }}>Running deterministic query…</span>
                </div>
                <div style={{ padding: '16px 16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[240, 360, 320, 280].map((w, i) => (
                    <div key={i} style={{ height: 12, width: w, maxWidth: '85%', borderRadius: 4, background: '#EEF1F5', animation: `tv-shimmer 1.1s ease-in-out ${i * 0.12}s infinite` }} />
                  ))}
                </div>
              </div>
            ) : exactAnswer ? (
              <>
                <div style={{ background: '#fff', border: BORDER, borderRadius: 9, boxShadow: '0 1px 3px rgba(25,35,49,0.04)', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: BORDER, background: '#FAFBFC' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#8B96A5', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>Exact answer</span>
                    <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: '#1D232F', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exactAnswer.title}</span>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: BORDER, borderRadius: 6, padding: 1, gap: 1, flexShrink: 0 }}>
                      {(['table', 'chart'] as const).map(m => (
                        <button
                          key={m}
                          onClick={() => setResultMode(m)}
                          style={{ fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 5, border: 'none', cursor: 'pointer', fontFamily: FONT, background: resultMode === m ? '#2770EF' : 'transparent', color: resultMode === m ? '#fff' : '#8B96A5', transition: 'all 120ms' }}
                        >{m === 'table' ? 'Table' : 'Chart'}</button>
                      ))}
                    </div>
                  </div>
                  {resultMode === 'table' ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {exactAnswer.cols.map(c => (
                            <th key={c} style={{ textAlign: 'left', padding: '9px 16px', fontSize: 10.5, fontWeight: 700, color: '#8B96A5', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: BORDER, background: '#FAFBFC' }}>{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {exactAnswer.rows.map((r, i) => (
                          <tr key={i}>
                            {r.map((cell, j) => (
                              <td key={j} style={{ padding: '9px 16px', fontSize: 12.5, color: j === 0 ? '#1D232F' : '#4B5563', fontWeight: j === 0 ? 600 : 400, borderBottom: i < exactAnswer.rows.length - 1 ? '1px solid #F3F5F8' : 'none' }}>{String(cell)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : renderChart(exactAnswer)}
                  {renderFeedback('exact')}
                </div>

                {answerSource === 'question' && (!spotterShown ? (
                  <button
                    onClick={viewSpotterAnswer}
                    style={{ width: '100%', marginTop: 12, height: 44, border: '1px dashed #C0C6CF', borderRadius: 9, background: '#fff', color: '#1D232F', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'border-color 120ms, background 120ms' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#2770EF'; e.currentTarget.style.background = '#F9FAFB'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#C0C6CF'; e.currentTarget.style.background = '#fff'; }}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ color: '#2770EF' }}>
                      <circle cx="6" cy="8" r="4" stroke="currentColor" strokeWidth="1.3"/><circle cx="10" cy="8" r="4" stroke="currentColor" strokeWidth="1.3"/>
                    </svg>
                    Compare with Spotter
                  </button>
                ) : (
                  <div style={{ marginTop: 12, background: '#fff', border: BORDER, borderRadius: 9, boxShadow: '0 1px 3px rgba(25,35,49,0.04)', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: BORDER, background: '#FAFBFC' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>Spotter's answer</span>
                      <span style={{ flex: 1, fontSize: 12, color: '#64748B' }}>
                        {spotterLoading ? 'Running through Spotter…' : spotterAnswer ? spotterAnswer.reasoning : ''}
                      </span>
                    </div>
                    {spotterLoading ? (
                      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[240, 320, 280].map((w, i) => (
                          <div key={i} style={{ height: 12, width: w, maxWidth: '80%', borderRadius: 4, background: '#EEF1F5', animation: `tv-shimmer 1.1s ease-in-out ${i * 0.12}s infinite` }} />
                        ))}
                      </div>
                    ) : spotterAnswer ? (
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            {exactAnswer.cols.map(c => (
                              <th key={c} style={{ textAlign: 'left', padding: '9px 16px', fontSize: 10.5, fontWeight: 700, color: '#8B96A5', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: BORDER, background: '#FAFBFC' }}>{c}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {spotterAnswer.rows.map((r, i) => (
                            <tr key={i}>
                              {r.map((cell, j) => {
                                const exactCell = exactAnswer.rows[i]?.[j];
                                const isDifferent = exactCell !== undefined && String(cell) !== String(exactCell);
                                return (
                                  <td
                                    key={j}
                                    style={{ padding: '9px 16px', fontSize: 12.5, color: j === 0 ? '#1D232F' : '#4B5563', fontWeight: j === 0 ? 600 : 400, borderBottom: i < spotterAnswer.rows.length - 1 ? '1px solid #F3F5F8' : 'none', background: isDifferent ? 'rgba(245,158,11,0.08)' : 'transparent', position: 'relative' }}
                                  >
                                    {String(cell)}
                                    {isDifferent && (
                                      <span style={{ position: 'absolute', right: 4, top: 4, width: 6, height: 6, borderRadius: '50%', background: '#F59E0B' }} />
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : null}
                    {spotterAnswer && renderFeedback('spotter')}
                  </div>
                ))}
              </>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
                <div style={{ textAlign: 'center', maxWidth: 360 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1D232F', marginBottom: 6 }}>Ready to test</div>
                  <div style={{ fontSize: 12, color: '#8B96A5', lineHeight: 1.5 }}>
                    Tokens are pre-filled from the requirements doc. Edit if needed, then click Run to see the exact answer.
                  </div>
                </div>
              </div>
            )}
          </div>

            </div>{/* /query bar + results column */}
          </div>{/* /body row */}
        </div>{/* /search-data container card */}
      </div>
    </div>
  );

  // ── Shared surfaces ─────────────────────────────────────────────────────────
  const evaluateSurface = <EvalView onEvaluated={() => setEvalDone(true)} />;

  const recBadge = (done: boolean) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 99, letterSpacing: '0.03em', textTransform: 'uppercase', color: done ? '#06BF7F' : '#2770EF', background: done ? 'rgba(6,191,127,0.10)' : 'rgba(39,112,239,0.10)' }}>
      {done && <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      {done ? 'Structure checked' : 'Recommended first'}
    </span>
  );

  const tuneWithNudge = tuneSurface;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: '#EEF1F5', fontFamily: FONT }}>
      {/* One-page layout: two delightful collapsible cards — Evaluate + Tune */}
      {(() => {
        const CARD_SHADOW = '0 1px 2px rgba(25,35,49,0.04), 0 8px 24px rgba(25,35,49,0.06)';
        const sectionCard = (opts: {
          open: boolean;
          onToggle: () => void;
          accent: string; accentBg: string;
          icon: React.ReactNode;
          title: string; subtitle: React.ReactNode;
          badge?: React.ReactNode;
          body: React.ReactNode;
        }) => (
          <div style={{ display: 'flex', flexDirection: 'column', flex: opts.open ? 1 : '0 0 auto', minHeight: 0, background: '#fff', border: '1px solid #E7EBF0', borderRadius: 14, boxShadow: CARD_SHADOW, overflow: 'hidden', transition: 'flex 180ms ease' }}>
            <button
              onClick={opts.onToggle}
              style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '15px 17px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: FONT, borderBottom: opts.open ? '1px solid #EEF1F5' : 'none' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#FAFBFC'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ width: 34, height: 34, borderRadius: 10, background: opts.accentBg, color: opts.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {opts.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#1D232F', letterSpacing: '-0.2px' }}>{opts.title}</span>
                  {opts.badge}
                </div>
                <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>{opts.subtitle}</div>
              </div>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: '#F0F2F6', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ transform: opts.open ? 'none' : 'rotate(-90deg)', transition: 'transform 160ms ease' }}><path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </button>
            <div style={{ flex: opts.open ? 1 : '0 0 0px', minHeight: 0, display: opts.open ? 'flex' : 'none', flexDirection: 'column' }}>
              {opts.body}
            </div>
          </div>
        );
        return (
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 14, padding: 16, overflow: 'hidden' }}>
            {sectionCard({
              open: evalOpen,
              onToggle: () => setEvalOpen(o => !o),
              accent: evalDone ? '#06BF7F' : '#2770EF',
              accentBg: evalDone ? 'rgba(6,191,127,0.10)' : 'rgba(39,112,239,0.08)',
              icon: <svg width="17" height="17" viewBox="0 0 20 20" fill="none"><path d="M4 13l3.5-4.5 3 3L17 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><rect x="2.5" y="2.5" width="15" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.4"/></svg>,
              title: 'Evaluate structure & semantics',
              subtitle: 'Joins, cardinality, descriptions, synonyms, and aggregation rules.',
              badge: recBadge(evalDone),
              body: evaluateSurface,
            })}
            {sectionCard({
              open: tuneOpen,
              onToggle: () => setTuneOpen(o => !o),
              accent: '#7C3AED',
              accentBg: 'rgba(124,58,237,0.08)',
              icon: <svg width="17" height="17" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6"/><path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
              title: 'Tune with questions',
              subtitle: <>{passingCount} of {questions.length} passing · test answers against Spotter.</>,
              body: tuneWithNudge,
            })}
          </div>
        );
      })()}

      {/* Modals */}
      {memoryModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ width: 420, background: '#fff', borderRadius: 10, padding: 20, fontFamily: FONT }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1D232F', marginBottom: 12 }}>Add to Memory</div>
            <textarea
              value={memoryNote}
              onChange={e => setMemoryNote(e.target.value)}
              placeholder="Describe what to remember…"
              style={{ width: '100%', minHeight: 80, padding: 10, border: BORDER, borderRadius: 6, fontSize: 12, fontFamily: FONT, resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => setMemoryModalOpen(false)} style={{ flex: 1, height: 34, border: BORDER, borderRadius: 6, background: '#fff', color: '#1D232F', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
              <button onClick={handleAddToMemory} style={{ flex: 1, height: 34, border: 'none', borderRadius: 6, background: '#2770EF', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {notWhatIMeantOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ width: 420, background: '#fff', borderRadius: 10, padding: 20, fontFamily: FONT }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1D232F', marginBottom: 8 }}>Not what you meant?</div>
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>This is a semantic issue — the token mapping doesn't match your intent. Adjust the tokens above to fix.</div>
            <button onClick={() => setNotWhatIMeantOpen(false)} style={{ width: '100%', height: 34, border: 'none', borderRadius: 6, background: '#2770EF', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>Got it</button>
          </div>
        </div>
      )}

      {wrongAnswerOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ width: 420, background: '#fff', borderRadius: 10, padding: 20, fontFamily: FONT }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1D232F', marginBottom: 12 }}>What's wrong with the answer?</div>
            <textarea
              value={wrongAnswerReason}
              onChange={e => setWrongAnswerReason(e.target.value)}
              placeholder="Describe the issue…"
              style={{ width: '100%', minHeight: 80, padding: 10, border: BORDER, borderRadius: 6, fontSize: 12, fontFamily: FONT, resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => setWrongAnswerOpen(false)} style={{ flex: 1, height: 34, border: BORDER, borderRadius: 6, background: '#fff', color: '#1D232F', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
              <button onClick={handleFixWithAI} style={{ flex: 1, height: 34, border: 'none', borderRadius: 6, background: '#2770EF', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>Fix with AI</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestView;
