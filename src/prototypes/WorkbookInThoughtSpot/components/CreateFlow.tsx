import React, { useEffect, useMemo, useState } from 'react';
import { SpotterPrompt, UserMessage } from '@spotter/chat';
import { Typography } from '@components/Typography';
import { Horizontal, Vertical } from '@components/Layout';
import { Icon } from '@components/icons';
import { LoadingIndicator } from '@components/LoadingIndicator';
import { FileUploader } from '@components/FileUploader';
import { ClarifyCard, CLARIFY_EXIT_MS, type ClarifyAnswer, type ClarifyStepView } from './ClarifyCard';
import { AnsweredQuestions } from './AnsweredQuestions';
import { WorkbookLoading } from './WorkbookLoading';
import { ANSWERS, INPUT_KINDS, MODELS, SOURCES, TEMPLATE_ROWS, buildSteps, type SourceId } from '../data/create';
import styles from './CreateFlow.module.css';

// Creating a workbook with Spotter (Vivek, 3 Nov 2026). The questions use the Apps prototype's
// question card (ClarifyCard, copied from AppsInTS_convoDrafts), docked above the composer.
// Question 1 is the data source, question 2 depends on it. A start card on the Workbooks page
// has already answered question 1, so the run starts at question 2. No plan card: once the
// questions are answered, the workbook opens on the right in its loading state.

const STRONG_MATCH = 80;
const MatchPill: React.FC<{ confidence: number }> = ({ confidence }) => (
  <span className={confidence >= STRONG_MATCH ? styles.matchStrong : styles.matchWeak}>{confidence}% match</span>
);

const sourceStep: ClarifyStepView = {
  id: 'source',
  question: 'Where should the data come from?',
  mode: 'single',
  requireAnswer: true,
  rows: SOURCES.map((s) => ({ id: s.id, label: s.label, leading: <Icon name={s.icon} size="m" /> })),
};

function secondStep(source: SourceId, onFile: (name: string) => void): ClarifyStepView {
  switch (source) {
    case 'model':
      return {
        id: 'model',
        question: 'Which data model?',
        mode: 'single',
        requireAnswer: true,
        rows: MODELS.map((m) => ({ id: m.id, label: m.label, trailing: <MatchPill confidence={m.confidence} /> })),
      };
    case 'upload':
      return {
        id: 'upload',
        question: 'Upload your file',
        mode: 'single',
        requireAnswer: true,
        body: (
          <div className={styles.upload}>
            <FileUploader
              helperText="Excel or CSV. Formulas are translated; data is saved to your warehouse."
              onFilesChange={(files) => files[0] && onFile(files[0].name)}
            />
          </div>
        ),
      };
    case 'answer':
      return { id: 'answer', question: 'Which Answer?', mode: 'single', requireAnswer: true, somethingElse: true, rows: ANSWERS };
    case 'input-table':
      return { id: 'input-table', question: 'What will you type in?', mode: 'single', requireAnswer: true, somethingElse: true, rows: INPUT_KINDS };
    case 'template':
      return { id: 'template', question: 'Which template?', mode: 'single', requireAnswer: true, rows: TEMPLATE_ROWS };
  }
}

const labelFor = (step: ClarifyStepView, answer: ClarifyAnswer | undefined): string => {
  if (!answer) return '';
  if (answer.other?.trim()) return answer.other.trim();
  if (step.id === 'upload') return answer.selected[0] ?? '';
  return answer.selected.map((id) => step.rows?.find((r) => r.id === id)?.label ?? id).join(', ');
};

export interface CreateFlowProps {
  /** What the user typed on Home, shown as their message. */
  seedPrompt?: string;
  /** Set when a start card on the Workbooks page already chose the source. */
  startSource?: SourceId;
}

type Phase = 'asking' | 'leaving' | 'building';

export const CreateFlow: React.FC<CreateFlowProps> = ({ seedPrompt, startSource }) => {
  const [answers, setAnswers] = useState<Record<string, ClarifyAnswer>>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('asking');
  const [done, setDone] = useState(0);
  const [reply, setReply] = useState('');

  const onAnswer = (id: string, a: ClarifyAnswer) => setAnswers((prev) => ({ ...prev, [id]: a }));
  const source: SourceId = startSource ?? ((answers.source?.selected[0] as SourceId) || 'model');

  // Until the source is picked, question 2 is the data model one, so the card counts two steps.
  const steps = useMemo<ClarifyStepView[]>(() => {
    const second = secondStep(source, (name) => onAnswer('upload', { selected: [name] }));
    return startSource ? [second] : [sourceStep, second];
  }, [source, startSource]);

  const second = steps[steps.length - 1];
  const detail = labelFor(second, answers[second.id]);
  const checklist = buildSteps(source, detail || 'your');
  const workbookName =
    source === 'model' ? `${detail} workbook` :
    source === 'upload' ? detail.replace(/\.[^.]+$/, '') :
    source === 'template' ? detail : 'Untitled workbook';

  const pairs = steps
    .map((s) => ({ question: s.question, answer: labelFor(s, answers[s.id]) }))
    .filter((p) => p.answer);
  if (startSource) {
    pairs.unshift({ question: sourceStep.question, answer: SOURCES.find((s) => s.id === startSource)?.label ?? '' });
  }

  const finish = () => {
    setPhase('leaving');
    setTimeout(() => setPhase('building'), CLARIFY_EXIT_MS);
  };

  // The build checklist ticks through, then the cells keep loading in the workbook.
  useEffect(() => {
    if (phase !== 'building') return;
    setDone(0);
    const timers = checklist.map((_, i) => setTimeout(() => setDone(i + 1), 900 * (i + 1)));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const intro = startSource
    ? 'Let’s set up your workbook. One question first.'
    : 'Let’s set up your workbook. Two quick questions first.';

  const thread = (
    <Vertical gap={16} className={styles.thread}>
      {seedPrompt && <UserMessage message={seedPrompt} />}
      <Horizontal gap={8} align="start">
        <Icon name="spotter" size="m" />
        <Typography variant="body-normal">{intro}</Typography>
      </Horizontal>
      {phase === 'building' && (
        <>
          <AnsweredQuestions pairs={pairs} />
          <Vertical gap={8}>
            <Horizontal gap={8} align="start">
              <Icon name="spotter" size="m" />
              <Typography variant="body-normal">Building your workbook.</Typography>
            </Horizontal>
            <Vertical gap={6} className={styles.checklist}>
              {checklist.map((label, i) => (
                <Horizontal key={label} gap={8} align="center">
                  {i < done ? <Icon name="checkmark-circle" size="s" color="var(--rd-sys-color-content-success)" /> : i === done ? <LoadingIndicator size="small" /> : <span className={styles.pending} />}
                  <Typography variant="body-normal" color={i <= done ? undefined : 'gray'}>{label}</Typography>
                </Horizontal>
              ))}
            </Vertical>
          </Vertical>
        </>
      )}
    </Vertical>
  );

  const composer = (
    <Vertical gap={0} className={styles.composer}>
      {phase !== 'building' && (
        <ClarifyCard
          steps={steps}
          stepIndex={stepIndex}
          onStepIndex={setStepIndex}
          answers={answers}
          onAnswer={onAnswer}
          onSkip={(id) => setAnswers((prev) => { const next = { ...prev }; delete next[id]; return next; })}
          onFinish={finish}
          leaving={phase === 'leaving'}
        />
      )}
      <SpotterPrompt value={reply} onChange={setReply} placeholder="Reply to Spotter" />
    </Vertical>
  );

  if (phase !== 'building') {
    return (
      <div className={styles.centered}>
        <div className={styles.column}>
          {thread}
          {composer}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.split}>
      <div className={styles.chat}>
        {thread}
        {composer}
      </div>
      <div className={styles.canvas}>
        <WorkbookLoading name={workbookName} status={done < checklist.length ? 'Loading Sheet 1' : 'Loading live data'} />
      </div>
    </div>
  );
};

export default CreateFlow;
