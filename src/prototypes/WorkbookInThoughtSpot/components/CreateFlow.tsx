import React, { useEffect, useMemo, useState } from 'react';
import { RadianceBackground, useRadianceState } from '@/app-chrome/RadianceBackground/RadianceBackground';
import { PromptBar, type OpenMenu } from '@spotter/chat';
import { Vertical } from '@components/Layout';
import { Icon } from '@components/icons';
import { FileUploader } from '@components/FileUploader';
import { ClarifyCard, CLARIFY_EXIT_MS, type ClarifyAnswer, type ClarifyStepView } from './ClarifyCard';
import { AnsweredQuestions } from './AnsweredQuestions';
import { WorkbookLoading } from './WorkbookLoading';
import { WorkbookLive } from './WorkbookLive';
import { ModelPickerDialog } from './WorkbookDialogs';
import { blankWorkbook, financeWorkbook } from '../data/finance';
import { ActionRow, AskedAQuestion, ShowWork, StreamingText, WorkingChecklist, agentTextStyle, streamMs, userBubbleStyle } from './ChatTurns';
import { CHAT_QUESTION, SOURCES, buildSteps, type SourceId } from '../data/create';
import styles from './CreateFlow.module.css';

// Creating a workbook with Spotter (Vivek, 3 Nov 2026).
// - The Apps prototype's question card (ClarifyCard, copied from AppsInTS_convoDrafts), docked
//   above the composer, asks only where the data comes from: data model, Answer, upload, blank.
// - Which data model or Answer is asked in the chat, and the user answers in the chat: every
//   customer has their own, so a ranked list of ours would be wrong.
// - Upload asks for the file in the card. Blank workbook needs nothing more.
// - A start card on the Workbooks page has already picked the source, so the card is skipped.
// - No plan card. The workbook opens on the right loading, then goes live when the build ends.
// - SpotterX look: the Radiance spotterx pattern behind the chat, no left nav.
// - The thread and composer are the Apps ones: Show work, streaming text, the action row, the
//   Working checklist, and the product composer (PromptBar) with the card docked above it.

const sourceStep: ClarifyStepView = {
  id: 'source',
  question: 'Where should the data come from?',
  mode: 'single',
  requireAnswer: true,
  rows: SOURCES.map((s) => ({ id: s.id, label: s.label, leading: <Icon name={s.icon} size="m" /> })),
};

const uploadStep = (onFile: (name: string) => void): ClarifyStepView => ({
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
});

type Item =
  | { kind: 'user'; text: string }
  | { kind: 'agent'; text: string }
  | { kind: 'recap'; pairs: { question: string; answer: string }[] };

// pick: the data-model picker is open (Vivek, 3 Nov: a modal like Pin to Liveboard, not a question in the chat).
type Phase = 'card' | 'leaving' | 'chat' | 'pick' | 'building';

const sourceLabel = (id: SourceId) => SOURCES.find((s) => s.id === id)?.label ?? '';

export interface CreateFlowProps {
  /** What the user typed on Home, shown as their message. */
  seedPrompt?: string;
  /** Set when a start card on the Workbooks page already chose the source. */
  startSource?: SourceId;
  /** A number unique to this run, for the Radiance state. */
  runId: number;
  onDeleted?: () => void;
}

export const CreateFlow: React.FC<CreateFlowProps> = ({ seedPrompt, startSource, runId, onDeleted }) => {
  const needsCard = !startSource || startSource === 'upload';
  const [answers, setAnswers] = useState<Record<string, ClarifyAnswer>>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>(needsCard ? 'card' : startSource === 'model' ? 'pick' : CHAT_QUESTION[startSource!] ? 'chat' : 'building');
  const [source, setSource] = useState<SourceId | undefined>(startSource);
  const [detail, setDetail] = useState('');
  const [reply, setReply] = useState('');
  const [built, setBuilt] = useState(false);
  const [openMenu, setOpenMenu] = useState<OpenMenu>('none');
  const [barFocused, setBarFocused] = useState(false);
  // The card docks only once the agent's turn has finished streaming, as in Apps.
  const [dockVisible, setDockVisible] = useState(false);

  const intro = needsCard ? 'Let’s set up your workbook.' : `Let’s set up a workbook from ${sourceLabel(startSource!).replace(/^An? /, 'an ').replace(/^ThoughtSpot/, 'a ThoughtSpot')}.`;
  const [items, setItems] = useState<Item[]>(() => {
    const first: Item[] = [];
    if (seedPrompt) first.push({ kind: 'user', text: seedPrompt });
    first.push({ kind: 'agent', text: intro });
    if (startSource && startSource !== 'model' && CHAT_QUESTION[startSource]) first.push({ kind: 'agent', text: CHAT_QUESTION[startSource]! });
    return first;
  });

  useEffect(() => {
    if (phase !== 'card') return;
    const t = setTimeout(() => setDockVisible(true), streamMs(intro));
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onAnswer = (id: string, a: ClarifyAnswer) => setAnswers((prev) => ({ ...prev, [id]: a }));
  const picked = (startSource ?? answers.source?.selected[0]) as SourceId | undefined;

  const steps = useMemo<ClarifyStepView[]>(() => {
    const upload = uploadStep((name) => onAnswer('upload', { selected: [name] }));
    if (startSource === 'upload') return [upload];
    return picked === 'upload' ? [sourceStep, upload] : [sourceStep];
  }, [picked, startSource]);

  const finishCard = () => {
    const chosen = picked ?? 'blank';
    const file = answers.upload?.selected[0] ?? '';
    const pairs = [{ question: sourceStep.question, answer: sourceLabel(chosen) }];
    if (chosen === 'upload') pairs.push({ question: 'Upload your file', answer: file });
    setPhase('leaving');
    setTimeout(() => {
      setSource(chosen);
      // A data model is picked in the model picker; an Answer is still named in the chat.
      const ask = chosen !== 'model' && CHAT_QUESTION[chosen];
      setItems((prev) => [
        ...prev,
        { kind: 'recap', pairs },
        ...(ask ? [{ kind: 'agent', text: CHAT_QUESTION[chosen]! } as Item] : []),
      ]);
      if (chosen === 'upload') setDetail(file);
      setPhase(chosen === 'model' ? 'pick' : ask ? 'chat' : 'building');
    }, CLARIFY_EXIT_MS);
  };

  const send = () => {
    const text = reply.trim();
    if (!text || phase !== 'chat') return;
    setItems((prev) => [...prev, { kind: 'user', text }]);
    setDetail(text.charAt(0).toUpperCase() + text.slice(1));
    setReply('');
    setPhase('building');
  };

  const chooseModel = (name: string) => {
    setItems((prev) => [...prev, { kind: 'recap', pairs: [{ question: 'Which data model?', answer: name }] }]);
    setDetail(name);
    setPhase('building');
  };
  // Closing the picker without a choice falls back to naming the model in the chat.
  const closePicker = () => {
    setItems((prev) => [...prev, { kind: 'agent', text: CHAT_QUESTION.model! }]);
    setPhase('chat');
  };

  const src: SourceId = source ?? (startSource === 'model' ? 'model' : 'blank');
  const checklist = buildSteps(src, detail);
  const workbookName =
    src === 'model' ? `${detail} workbook` :
    src === 'upload' ? detail.replace(/\.[^.]+$/, '') || 'Uploaded workbook' :
    src === 'answer' ? detail : 'Untitled workbook';

  const radiance = useRadianceState(runId, phase === 'building' && !built);

  const thread = (
    <Vertical gap={20} className={styles.thread}>
      {items.map((item, i) =>
        item.kind === 'user' ? (
          <div key={i} className={styles.userRow}><div style={userBubbleStyle}>{item.text}</div></div>
        ) : item.kind === 'recap' ? (
          <div key={i}>
            <AnsweredQuestions pairs={item.pairs} />
            <AskedAQuestion />
          </div>
        ) : (
          <div key={i}>
            <ShowWork />
            <p style={agentTextStyle}><StreamingText text={item.text} /></p>
            <ActionRow />
          </div>
        ),
      )}
      {phase === 'building' && <WorkingChecklist steps={checklist} onDone={() => setBuilt(true)} />}
    </Vertical>
  );

  const showCard = (phase === 'card' && dockVisible) || phase === 'leaving';
  const composer = (
    <Vertical gap={0} className={styles.composer}>
      {showCard && (
        <div className={styles.dock}>
          <ClarifyCard
            steps={steps}
            stepIndex={stepIndex}
            onStepIndex={setStepIndex}
            answers={answers}
            onAnswer={onAnswer}
            onSkip={(id) => setAnswers((prev) => { const next = { ...prev }; delete next[id]; return next; })}
            onFinish={finishCard}
            leaving={phase === 'leaving'}
          />
        </div>
      )}
      {/* The product composer, docked. Menus open upward because the bar sits at the bottom. */}
      <PromptBar
        value={reply}
        onValueChange={setReply}
        onSend={send}
        placeholder={showCard ? 'or reply directly…' : phase === 'chat' ? (src === 'model' ? 'Name a data model' : 'Name an Answer') : undefined}
        minLines={1}
        menuDirection="up"
        focused={barFocused}
        onFocus={() => setBarFocused(true)}
        onBlur={() => setBarFocused(false)}
        openMenu={openMenu}
        onOpenMenuChange={setOpenMenu}
      />
    </Vertical>
  );

  return (
    <div className={styles.root}>
      <RadianceBackground pattern="spotterx" state={radiance} />
      <ModelPickerDialog isOpen={phase === 'pick'} onClose={closePicker} onChoose={chooseModel} />
      {phase !== 'building' ? (
        <div className={styles.centered}>
          <div className={styles.column}>
            {thread}
            {composer}
          </div>
        </div>
      ) : (
        <div className={styles.split}>
          <div className={styles.chat}>
            {thread}
            {composer}
          </div>
          <div className={styles.canvas}>
            {built ? <WorkbookLive onDeleted={onDeleted} initial={src === 'blank' ? blankWorkbook(workbookName) : financeWorkbook(src === 'model' ? detail : 'Finance', workbookName)} /> : <WorkbookLoading name={workbookName} status="Loading Sheet 1" />}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateFlow;
