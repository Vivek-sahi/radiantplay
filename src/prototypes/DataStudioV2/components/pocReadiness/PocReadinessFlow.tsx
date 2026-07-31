import React, { useEffect, useMemo, useRef, useState } from 'react';
import './readiness.css';
import { AgentMessage, UserBubble, ReasoningBlock, VersionCard, TypingIndicator } from '../../../_agentic/index';
import type { ReasoningData } from '../../../_agentic/index';
import {
  CALIBRATION_FIXES, FIX_META, FIX_PROBLEM, FIX_TARGETS, CHANGE_TAG, IMPACT_META, PILLAR_CHECKS, SPOTTER_QUESTIONS,
} from './data';
import type { Issue, ImpactTier, DiffField } from './data';
import CalFixesDock from './CalFixesDock';
import type { FixGroup, FixItem } from './CalFixesDock';
import { spotterFix } from './spotterFix';
import InlineGrading from './InlineGrading';
import { Check } from './icons';
import type { GradingResult } from './gradingTypes';

/**
 * POC AI-readiness flow — ported from the source repo's agentic calibration experience
 * (Calibration/components/CalibrationAgentPanel.tsx) into DataStudioV2's own agent panel.
 *
 * Differences from the source (see MERGE_POC_AI_READINESS.md):
 *  - Readiness journey only: physical → semantic check passes → Spotter answer-grading →
 *    apply fixes → Spotter ready. No drift monitoring.
 *  - Agent-panel only: the source spotlighted each fix on the DME canvas via `_dme*` window
 *    bridges + a CanvasFixOverlay. That is all removed here — fixes are reviewed inline in
 *    the fixes dock (before→after diff on the info action). No canvas dependency.
 *  - Renders its own `.calx`-scoped panel chrome (the source reused the DME host's
 *    `.agent-panel`/`.chat-*` classes, which don't exist in DataStudioV2).
 *
 * It is mounted by DataStudioV2's AgentPanel as an early return when the POC readiness flow
 * is active (started from the AI-readiness pill's dropdown CTA in ModelCanvas).
 */
type PassId = 'physical' | 'semantic';
type MsgKind = 'user' | 'agent' | 'pass' | 'grading' | 'summary';
interface Msg {
  id: number;
  kind: MsgKind;
  text?: string;
  html?: string;
  leadText?: string;     // a line shown above the reasoning block, in the same response
  runTitle?: string;
  runRunning?: string;   // overrides the "Running … checks" header
  runDoneLabel?: string; // overrides the "Ran … checks" header
  runChecks?: string[];
  runStreamed?: number;
  runDone?: boolean;
  introText?: string;
  version?: { num: number; label: string };  // saved-model version card (rendered on its own)
  summaryTitle?: string;   // clean "N fixes applied" summary card
  summaryItems?: string[]; // the applied fix titles listed in the summary
}

interface Props {
  /** Which check passes to run (pillar ids). Defaults to all three (physical + semantic + Spotter answers). */
  scope?: Set<string>;
  onClose: () => void;
  /** Panel width when embedded (non-fullPage). Matches the host AgentPanel width. */
  width?: number;
  fullPage?: boolean;
}

// Minimal markdown: render **bold** as <strong>. The _agentic response block prints plain
// text, so we render agent copy ourselves to keep emphasis (e.g. "**4** fixes") readable.
const renderRich = (text: string): React.ReactNode =>
  text.split(/(\*\*[^*]+\*\*)/g).map((seg, i) =>
    seg.startsWith('**') && seg.endsWith('**')
      ? <strong key={i}>{seg.slice(2, -2)}</strong>
      : <React.Fragment key={i}>{seg}</React.Fragment>);

const scopeLabel = (scope: Set<string>): string => {
  const parts: string[] = [];
  if (scope.has('physical')) parts.push('Physical health');
  if (scope.has('semantic')) parts.push('Semantics');
  if (scope.has('ai')) parts.push('Spotter answers');
  if (parts.length <= 1) return parts[0] ?? '';
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
};

const PASS_LABEL: Record<PassId, string> = { physical: 'physical', semantic: 'semantic' };
const passFixes = (p: PassId): Issue[] => CALIBRATION_FIXES.filter((f) => f.pillar === p);

const REFINED_HEADLINE: Record<string, string> = {
  i1: 'Change invoices → orders join cardinality to Many : One',
  i2: 'Re-key the support tickets join to customer_id',
  i3: 'Use COUNT(DISTINCT order_id) in Average Deal Size',
  i4: 'Compute Gross Margin % from the actual cost column',
  i5: 'Auto-generate AI descriptions for all 42 columns',
  i6: 'Split "amount" into booked vs. invoiced context',
  i7: 'Rename arr → Annual recurring revenue, keep arr as synonym',
  i8: 'Add "bookings / revenue / sales" synonyms to booked amount',
  i9: 'Document what Low / Medium / High churn_risk mean',
};

const ALL_SCOPE: string[] = ['physical', 'semantic', 'ai'];

const PocReadinessFlow: React.FC<Props> = ({ scope, onClose, width = 360, fullPage = false }) => {
  // Default to the full readiness journey when the caller didn't narrow the scope.
  const scopeSet = useMemo<Set<string>>(() => (scope && scope.size ? scope : new Set<string>(ALL_SCOPE)), [scope]);
  const wantsSpotter = scopeSet.has('ai');
  const passOrder = useMemo<PassId[]>(
    () => (['physical', 'semantic'] as PassId[]).filter((p) => scopeSet.has(p)),
    [scopeSet],
  );
  const allPhysSem = useMemo(() => passOrder.flatMap((p) => passFixes(p)), [passOrder]);

  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [runningStep, setRunningStep] = useState<number | null>(null);
  const [fixesStep, setFixesStep] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(allPhysSem.map((f) => f.id)));
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  // A refined fix can also change its diff (not just the title).
  const [refineData, setRefineData] = useState<Record<string, { diff?: DiffField[] }>>({});
  const [shimmerId, setShimmerId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  // Spotter grading
  const [, setGradeResult] = useState<GradingResult | null>(null);
  const [spotterIssues, setSpotterIssues] = useState<Issue[]>([]);
  const [spotterFixesActive, setSpotterFixesActive] = useState(false);
  // Live composer — a typed question gets a short, on-topic scripted reply.
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);

  const idc = useRef(0);
  const timers = useRef<number[]>([]);
  const bodyRef = useRef<HTMLDivElement>(null);
  const totals = useRef({ applied: 0 });
  const versionRef = useRef(1); // v1 = the model as it stands before any fixes
  const currentRun = useRef<{ msgId: number; index: number } | null>(null);
  const bumpVersion = (label: string) => { versionRef.current += 1; return { num: versionRef.current, label }; };
  const push = (m: Omit<Msg, 'id'>): number => {
    const id = ++idc.current;
    setMsgs((prev) => [...prev, { id, ...m }]);
    return id;
  };
  const updateMsg = (id: number, patch: Partial<Msg>) =>
    setMsgs((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  const clearTimers = () => { timers.current.forEach((t) => clearTimeout(t)); timers.current = []; };

  // Stream a reasoning/loading block (like the check passes), then reveal the intro text and
  // hand off. Used for the wrong-answer fix drafting so it doesn't feel instant.
  const runStream = (opts: { lead?: string; title?: string; running?: string; doneLabel?: string; checks: string[]; dur: number; introText: string; onDone: () => void }) => {
    const msgId = push({ kind: 'pass', leadText: opts.lead, runTitle: opts.title, runRunning: opts.running, runDoneLabel: opts.doneLabel, runChecks: opts.checks, runStreamed: 0, runDone: false });
    const per = opts.dur / Math.max(opts.checks.length, 1);
    opts.checks.forEach((_, i) => later(() => updateMsg(msgId, { runStreamed: i + 1 }), per * (i + 1)));
    later(() => {
      updateMsg(msgId, { runDone: true, runStreamed: opts.checks.length, introText: opts.introText });
      later(opts.onDone, 300);
    }, opts.dur + 250);
  };

  useEffect(() => { const el = bodyRef.current; if (el) el.scrollTop = el.scrollHeight; }, [msgs, fixesStep, spotterFixesActive, typing]);

  useEffect(() => {
    idc.current = 0;
    totals.current = { applied: 0 };
    versionRef.current = 1;
    currentRun.current = null;
    clearTimers();
    setMsgs([]);
    setRunningStep(null);
    setFixesStep(null);
    setSelected(new Set(allPhysSem.map((f) => f.id)));
    setOverrides({});
    setShimmerId(null);
    setHighlightedId(null);
    setGradeResult(null);
    setSpotterIssues([]);
    setSpotterFixesActive(false);

    push({ kind: 'user', text: `Check Spotter readiness for ${scopeLabel(scopeSet)}.` });
    later(() => runPass(0), 600);
    return () => clearTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const introFor = (index: number, count: number, pass: PassId): string =>
    count === 0
      ? `The ${PASS_LABEL[pass]} layer looks clean — no changes needed.`
      : index === 0
        ? `I've found **${count}** ${count === 1 ? 'fix' : 'fixes'} to make your model's structure better. Review them below.`
        : `Now the ${PASS_LABEL[pass]} layer — **${count}** ${count === 1 ? 'fix' : 'fixes'} to review below.`;

  // After the physical/semantic passes: run Spotter if requested, then finish.
  const afterPasses = () => {
    if (wantsSpotter) startSpotter();
    else finish();
  };

  const runPass = (index: number) => {
    const pass = passOrder[index];
    if (!pass) { afterPasses(); return; }
    const checks = PILLAR_CHECKS[pass];
    const msgId = push({ kind: 'pass', runTitle: PASS_LABEL[pass], runChecks: checks, runStreamed: 0, runDone: false });
    currentRun.current = { msgId, index };
    setRunningStep(index);
    const DUR = pass === 'physical' ? 3200 : 2200;
    const per = DUR / Math.max(checks.length, 1);
    checks.forEach((_, i) => later(() => updateMsg(msgId, { runStreamed: i + 1 }), per * (i + 1)));
    later(() => finishRun(index, msgId), DUR + 250);
  };

  const finishRun = (index: number, msgId: number) => {
    const pass = passOrder[index];
    const fixes = passFixes(pass);
    updateMsg(msgId, { runDone: true, runStreamed: PILLAR_CHECKS[pass].length, introText: introFor(index, fixes.length, pass) });
    setRunningStep(null);
    currentRun.current = null;
    if (fixes.length === 0) later(() => runPass(index + 1), 600);
    else {
      setFixesStep(index);
      // Semantic fixes preview on the canvas data panel (Model-level Semantic, grown + proposals).
      if (pass === 'semantic') (window as any).__dsSemanticPreview__?.();
    }
  };

  const stopRun = () => {
    const cur = currentRun.current;
    if (!cur) return;
    clearTimers();
    finishRun(cur.index, cur.msgId);
  };

  // Shared apply sequence: re-run the reasoning (streaming each fix being applied) → a clean
  // summary card of what changed → then, on its own, the model version card → then continue.
  const applyWithReasoning = (
    chosen: Issue[], layerLabel: string, versionLabel: string, onContinue: () => void,
  ) => {
    const n = chosen.length;
    totals.current.applied += n;
    setFixesStep(null);
    setSpotterFixesActive(false);
    setHighlightedId(null);
    push({ kind: 'user', text: n === 1 ? 'Apply this fix' : 'Apply these fixes' });
    const titles = chosen.map((f) => titleOf(f.id));
    // Stream each fix being applied (cap the visible lines), then the save step.
    const applyLines = [...titles.slice(0, 4).map((t) => `Applying · ${t}`)];
    if (titles.length > 4) applyLines.push(`Applying · +${titles.length - 4} more`);
    applyLines.push('Saving new model version');
    runStream({
      running: 'Applying fixes',
      doneLabel: `Applied ${n} ${n === 1 ? 'fix' : 'fixes'}`,
      checks: applyLines,
      dur: 1500,
      introText: '',
      onDone: () => {
        push({ kind: 'summary', summaryTitle: `${n} ${n === 1 ? 'fix' : 'fixes'} applied to the ${layerLabel} layer`, summaryItems: titles });
        later(() => push({ kind: 'agent', version: bumpVersion(versionLabel) }), 600);
        later(onContinue, 1500);
      },
    });
  };

  const applyStep = () => {
    if (fixesStep == null) return;
    const index = fixesStep;
    const pass = passOrder[index];
    const chosen = passFixes(pass).filter((f) => selected.has(f.id));
    // Accept → the canvas preview shows a loading state then the applied (filled) values.
    if (pass === 'semantic') (window as any).__dsSemanticApply__?.();
    applyWithReasoning(chosen, PASS_LABEL[pass], `${pass === 'physical' ? 'Physical' : 'Semantic'} fixes`, () => runPass(index + 1));
  };

  const skipStep = () => {
    if (fixesStep == null) return;
    const index = fixesStep;
    const pass = passOrder[index];
    // Reject → clear the semantic proposals overlay from the canvas preview.
    if (pass === 'semantic') (window as any).__dsSemanticReject__?.();
    setFixesStep(null);
    setHighlightedId(null);
    push({ kind: 'user', text: `Skip the ${PASS_LABEL[pass]} fixes.` });
    push({ kind: 'agent', text: `Skipped the ${PASS_LABEL[pass]} fixes.` });
    later(() => runPass(index + 1), 600);
  };

  // Refined-fix results. Keyed by fix id: the new row title + an optional new diff.
  const REFINE_RESULT: Record<string, { title: string; diff?: DiffField[] }> = {
    // Physical join fix: modeller says invoices ↔ orders are actually one-to-one → switch to One : One.
    i1: {
      title: 'Set invoices → orders join to One : One',
      diff: [{ field: 'Cardinality', before: '1 : Many', after: 'One : One' }],
    },
  };

  const refineFix = (id: string, _prompt: string) => {
    setShimmerId(id);
    later(() => {
      const r = REFINE_RESULT[id];
      setOverrides((o) => ({ ...o, [id]: r?.title ?? REFINED_HEADLINE[id] ?? titleOf(id) }));
      if (r) setRefineData((d) => ({ ...d, [id]: { diff: r.diff } }));
      setShimmerId(null);
    }, 1600);
  };

  // ── Spotter grading ──
  // The Spotter step is one message: the reasoning streams, then the intro + grading card
  // appear in the same response (one avatar).
  const startSpotter = () => {
    const msgId = push({ kind: 'grading', runTitle: 'Spotter', runChecks: PILLAR_CHECKS.ai, runStreamed: 0, runDone: false });
    const DUR = 3400;
    const per = DUR / PILLAR_CHECKS.ai.length;
    PILLAR_CHECKS.ai.forEach((_, i) => later(() => updateMsg(msgId, { runStreamed: i + 1 }), per * (i + 1)));
    later(() => updateMsg(msgId, {
      runDone: true,
      runStreamed: PILLAR_CHECKS.ai.length,
      introText: 'Here’s how Spotter answered a set of sample questions. Grade each — I’ll fix the ones that are wrong.',
    }), DUR + 250);
  };

  const onGradeDone = (result: GradingResult) => {
    setGradeResult(result);
    const incorrect = result.questions.filter((q) => result.verdicts[q.id]?.state === 'incorrect');
    const oos = result.questions.filter((q) => result.verdicts[q.id]?.state === 'oos').length;
    const issues = incorrect.map(spotterFix);
    setSpotterIssues(issues);
    setSelected((prev) => { const n = new Set(prev); issues.forEach((i) => n.add(i.id)); return n; });
    const oosNote = oos > 0 ? ` I’ll leave the ${oos} out-of-scope ${oos === 1 ? 'answer' : 'answers'} alone.` : '';
    if (issues.length === 0) {
      push({ kind: 'agent', text: `Those answers look right — nothing to fix.${oosNote}` });
      later(finish, 500);
    } else {
      later(() => runStream({
        lead: `You flagged **${issues.length}** ${issues.length === 1 ? 'answer' : 'answers'} as wrong.${oosNote} Let me work out ${issues.length === 1 ? 'a fix' : 'fixes'}.`,
        running: 'Working out the fixes',
        doneLabel: 'Worked out the fixes',
        checks: ['Reviewing the flagged answers', 'Tracing each to the model', 'Drafting the fixes'],
        dur: 2200,
        introText: `Here ${issues.length === 1 ? 'is the fix' : 'are the fixes'} to correct ${issues.length === 1 ? 'it' : 'them'} — review below.`,
        onDone: () => setSpotterFixesActive(true),
      }), 400);
    }
  };

  const applySpotterFixes = () => {
    const chosen = spotterIssues.filter((i) => selected.has(i.id));
    applyWithReasoning(chosen, 'Spotter answers', 'Spotter answer fixes', finish);
  };

  const skipSpotterFixes = () => {
    setSpotterFixesActive(false);
    setHighlightedId(null);
    push({ kind: 'user', text: 'Skip the Spotter fixes.' });
    push({ kind: 'agent', text: 'Skipped the Spotter fixes.' });
    later(finish, 600);
  };

  // Celebrate: once checks land, tell the modeller the model is more ready for Spotter.
  const finish = () => {
    if (totals.current.applied > 0) {
      later(() => push({ kind: 'agent', text: '✅ All set — your model is more ready for Spotter. Answers should be more accurate now.' }), 300);
    } else {
      later(() => push({ kind: 'agent', text: '✅ Checks complete — nothing needed fixing right now.' }), 300);
    }
  };

  // Live composer — a short, on-topic scripted reply keeps the panel feeling alive without
  // changing the readiness flow itself.
  const cannedReply = (q: string): string => {
    const t = q.toLowerCase();
    if (/physical|join|key|type|structure|cardinal|null|dupe/.test(t)) return 'The physical layer covers joins, keys, and column types. Run the physical checks from the Spotter readiness pill and I’ll flag anything off.';
    if (/semantic|synonym|description|name|context|meaning/.test(t)) return 'Semantics is names, descriptions, synonyms, and AI context. I can scan it and suggest fixes — start it from the Spotter readiness pill.';
    if (/spotter|answer|question|grade|accuracy|wrong/.test(t)) return 'I can grade how Spotter answers your sample questions and fix the ones that miss. Kick it off from the Spotter readiness pill.';
    return 'I can check your model’s Spotter readiness — physical structure, semantics, and how Spotter answers real questions. Open the Spotter readiness pill to run a check.';
  };
  const sendPrompt = () => {
    const q = input.trim();
    if (!q || runningStep != null) return;
    setInput('');
    push({ kind: 'user', text: q });
    setTyping(true);
    later(() => { setTyping(false); push({ kind: 'agent', text: cannedReply(q) }); }, 900);
  };

  const onToggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  // Info action toggles the inline detail on a fix row (agent-only — no canvas).
  const onInfo = (id: string) => setHighlightedId((cur) => (cur === id ? null : id));
  const titleOf = (id: string): string => overrides[id] ?? FIX_META[id]?.headline ?? spotterIssues.find((i) => i.id === id)?.title ?? '';

  // The inline-detail payload for a fix row (before→after diff, tag, where, impact).
  const detailOf = (id: string): Omit<FixItem, 'id' | 'title'> => {
    const meta = FIX_META[id];
    const iss = spotterIssues.find((i) => i.id === id);
    const isSpotter = id.startsWith('fix-');
    const tag = meta ? CHANGE_TAG[meta.changeType] : { label: isSpotter ? 'Spotter fix' : 'Fix', tone: 'edit' as const };
    const diff = refineData[id]?.diff ?? meta?.diff ?? iss?.diff ?? [];
    const target = iss?.fixTarget ?? FIX_TARGETS[id];
    return {
      where: target?.where,
      tag,
      diff,
      impact: meta?.impact ?? iss?.impact,
      suggestion: (meta || diff.length) ? undefined : iss?.suggestion,
    };
  };
  // Row title = the value-driven problem; description = the recommendation (the fix). When no
  // problem is mapped, fall back to just the recommendation as the title (no description).
  const toItem = (id: string): FixItem => {
    const problem = FIX_PROBLEM[id];
    const rec = titleOf(id);
    return { id, title: problem ?? rec, desc: problem ? rec : undefined, ...detailOf(id) };
  };

  // Dock content — the active physical/semantic step, or the Spotter fixes.
  const dock = useMemo<{ groups: FixGroup[]; stepLabel: string; onApply: () => void; onSkip: () => void } | null>(() => {
    if (fixesStep != null) {
      const pass = passOrder[fixesStep];
      const fixes = passFixes(pass);
      const byTier = new Map<ImpactTier, FixItem[]>();
      for (const f of fixes) {
        const s = FIX_META[f.id].severity;
        (byTier.get(s) ?? byTier.set(s, []).get(s)!).push(toItem(f.id));
      }
      const groups = [...byTier.entries()]
        .sort((a, b) => IMPACT_META[a[0]].order - IMPACT_META[b[0]].order)
        .map(([s, items]) => ({ key: s, label: IMPACT_META[s].label, items }));
      return { groups, stepLabel: PASS_LABEL[pass], onApply: applyStep, onSkip: skipStep };
    }
    if (spotterFixesActive) {
      const groups = spotterIssues.map((i) => ({ key: i.id, label: i.basedOn ?? 'Answer', items: [toItem(i.id)] }));
      return { groups, stepLabel: 'Spotter', onApply: applySpotterFixes, onSkip: skipSpotterFixes };
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixesStep, spotterFixesActive, spotterIssues, selected, overrides, refineData, passOrder]);

  const renderRunning = (m: Msg): ReasoningData => {
    const checks = m.runChecks ?? [];
    const streamed = checks.slice(0, m.runStreamed ?? 0);
    const defHeader = `${m.runDone ? 'Ran' : 'Running'} ${m.runTitle} checks`;
    return {
      header: m.runDone ? (m.runDoneLabel ?? defHeader) : (m.runRunning ?? defHeader),
      isDone: !!m.runDone,
      inlineText: streamed.length ? streamed[streamed.length - 1] : 'Analysing your model…',
      steps: streamed.map((c, i) => ({ n: i + 1, name: c, text: '', dotState: (m.runDone || i < streamed.length - 1) ? 'done' : 'current' })),
    };
  };

  const noop = () => {};

  const renderMsg = (m: Msg) => {
    switch (m.kind) {
      case 'user':
        // Note: DataStudioV2's _agentic UserBubble renders plain text only (no `html` prop,
        // unlike the source copy). The bulleted apply-summary is dropped to the short label.
        return <UserBubble key={m.id} text={m.text ?? ''} />;
      case 'agent':
        return (
          <AgentMessage key={m.id}>
            {m.text && <div className="pr-text">{renderRich(m.text)}</div>}
            {m.version && (
              <VersionCard versionNum={m.version.num} label={m.version.label} isLatest={m.version.num === versionRef.current} onRestore={noop} />
            )}
          </AgentMessage>
        );
      case 'pass':
        return (
          <AgentMessage key={m.id}>
            {m.leadText && <div className="calx-ag-lead pr-text">{renderRich(m.leadText)}</div>}
            <ReasoningBlock data={renderRunning(m)} />
            {m.runDone && m.introText && (
              <div className="pr-text pr-intro">{renderRich(m.introText)}</div>
            )}
          </AgentMessage>
        );
      case 'grading': {
        const gradeReady = !m.runChecks || m.runDone;
        return (
          <AgentMessage key={m.id}>
            {m.runChecks && <ReasoningBlock data={renderRunning(m)} />}
            {gradeReady && (
            <div className="calx-ag-passbody">
              {m.introText && <div className="pr-text">{renderRich(m.introText)}</div>}
              <div className="calx-gcard">
                <InlineGrading 
                  questions={SPOTTER_QUESTIONS} 
                  onDone={onGradeDone}
                  onEdit={(question) => {
                    // TODO: Handle edit - will be implemented based on user requirements
                    console.log('Edit question:', question);
                  }}
                />
              </div>
            </div>
            )}
          </AgentMessage>
        );
      }
      case 'summary':
        return (
          <AgentMessage key={m.id}>
            <div className="pr-summary">
              <div className="pr-summary-title">{m.summaryTitle}</div>
              {!!m.summaryItems?.length && (
                <ul className="pr-summary-list">
                  {m.summaryItems.map((t, i) => (
                    <li key={i} className="pr-summary-item" style={{ animationDelay: `${i * 70}ms` }}>
                      <Check size={13} strokeWidth={2.8} /><span>{t}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </AgentMessage>
        );
      default:
        return null;
    }
  };

  return (
    <div className="calx pr-root" style={{ width: fullPage ? '100%' : width }}>
      <div className="pr-header">
        <button className="pr-back" onClick={onClose} aria-label="Close readiness">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="10,4 6,8 10,12" /></svg>
        </button>
        <span className="pr-title">Spotter readiness</span>
        <span className="pr-flex" />
      </div>

      <div className="pr-messages" ref={bodyRef}>
        {msgs.map(renderMsg)}
        {typing && <AgentMessage><TypingIndicator label="Thinking…" /></AgentMessage>}
      </div>

      {dock ? (
        <div className="pr-dockwrap calx-cal-dockwrap">
          <CalFixesDock
            stepLabel={dock.stepLabel}
            groups={dock.groups}
            selected={selected}
            onToggle={onToggle}
            onApply={dock.onApply}
            onSkip={dock.onSkip}
            onInfo={onInfo}
            highlightedId={highlightedId}
            onRefine={refineFix}
            shimmerId={shimmerId}
          />
        </div>
      ) : (
        <div className="pr-composer">
          <div className="prompt-bar">
            <textarea
              className="agent-textarea"
              placeholder={runningStep != null ? 'Checking Spotter readiness…' : 'Ask about your model’s readiness'}
              disabled={runningStep != null}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendPrompt(); } }}
              rows={1}
            />
            <div className="prompt-bar-actions">
              {runningStep != null ? (
                <button className="send-btn" title="Stop" onClick={stopRun}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><rect x="2.5" y="2.5" width="9" height="9" rx="1.5" fill="white" /></svg>
                </button>
              ) : (
                <button className="send-btn" title="Send" disabled={!input.trim()} onClick={sendPrompt}>
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 13V3M4 7l4-4 4 4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="pr-footer">Spotter responses should be reviewed. <a href="#" onClick={(e) => e.preventDefault()}>Learn more</a></div>
    </div>
  );
};

export default PocReadinessFlow;
