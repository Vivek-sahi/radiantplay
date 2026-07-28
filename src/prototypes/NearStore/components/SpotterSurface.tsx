import React, { useState } from 'react';
import { SpotterWelcome } from '@spotter/page';
import {
  SpotterChatProvider,
  useSpotterChat,
  SpotterPrompt,
  UserBubble,
  ReasoningBlock,
  TypingIndicator,
  VizBlock,
  TextBlock,
  FollowUpsBlock,
} from '@spotter/chat';
import type { AnswerBlock, ChatMessage } from '@spotter/runtime';
import { Icon } from '@/components';
import { CacheMarker, type CacheCopy } from './CacheMarker';
import { ModelPickerModal } from './ModelPickerModal';
import { spotterModels, type SpotterModel } from '../spotterData';
import styles from './SpotterSurface.module.css';

type CachePlacement = 'above' | 'below' | 'header-icon';

/**
 * Spotter business-user surface. Reuses the real @spotter chat engine
 * (SpotterChatProvider + useSpotterChat), so the reasoning "Show work" ladder
 * animates exactly like the product. The only Near Store addition is the
 * cached/live provenance marker on the answer card (VizBlock `meta` slot),
 * driven by the selected model. Reasoning stays generic — no cache content
 * (deferred; see the requirements doc).
 */
export const SpotterSurface: React.FC<{ cacheVariant?: CachePlacement; copyVariant?: CacheCopy }> = ({
  cacheVariant = 'above',
  copyVariant = 'default',
}) => (
  <SpotterChatProvider mode="canned">
    <SpotterSurfaceInner cacheVariant={cacheVariant} copyVariant={copyVariant} />
  </SpotterChatProvider>
);

const SpotterSurfaceInner: React.FC<{ cacheVariant: CachePlacement; copyVariant: CacheCopy }> = ({
  cacheVariant,
  copyVariant,
}) => {
  const [promptValue, setPromptValue] = useState('');
  const [modelId, setModelId] = useState(spotterModels[0].id);
  const [pickerOpen, setPickerOpen] = useState(false);
  const { state, send } = useSpotterChat();

  const activeModel = spotterModels.find((m) => m.id === modelId) ?? spotterModels[0];
  const isChatActive = state.messages.length > 0;

  const promptProps = {
    value: promptValue,
    onChange: setPromptValue,
    onSubmit: (v: string) => {
      if (v.trim()) {
        send(v);
        setPromptValue('');
      }
    },
    dataModelLabel: activeModel.name,
    onDataModelClick: () => setPickerOpen(true),
  };

  return (
    <div className={styles.surface}>
      {!isChatActive ? (
        <div className={styles.landing}>
          <SpotterWelcome promptProps={promptProps} />
        </div>
      ) : (
        <div className={styles.chat}>
          <div className={styles.thread}>
            <div className={styles.threadInner}>
              {state.messages.map((m) =>
                m.role === 'user' ? (
                  <UserBubble key={m.id} message={m} initial="V" />
                ) : (
                  <AgentTurn
                    key={m.id}
                    message={m}
                    activeModel={activeModel}
                    cacheVariant={cacheVariant}
                    copyVariant={copyVariant}
                  />
                ),
              )}
            </div>
          </div>
          <div className={styles.promptArea}>
            <div className={styles.promptWrapper}>
              <SpotterPrompt {...promptProps} />
            </div>
            <p className={styles.disclaimer}>Spotter responses should be reviewed.</p>
          </div>
        </div>
      )}

      <ModelPickerModal
        isOpen={pickerOpen}
        models={spotterModels}
        selectedId={modelId}
        onClose={() => setPickerOpen(false)}
        onSelect={setModelId}
      />
    </div>
  );
};

type FreshnessInfo = { state: 'cached'; detail: string } | { state: 'live' };

/**
 * Per-ANSWER freshness. A specific answer can be served cached or live
 * regardless of the selected model — DAU is served from the Near Store cache,
 * MAU runs live from the warehouse. Answers not listed here fall back to the
 * selected model's cache state.
 */
const ANSWER_FRESHNESS: Record<string, FreshnessInfo> = {
  'viz-dau': { state: 'cached', detail: '23 Jun, 9:00 AM' },
  'viz-mau': { state: 'live' },
};

const modelFreshness = (m: SpotterModel): FreshnessInfo =>
  m.cache.state === 'cached' ? { state: 'cached', detail: m.cache.lastRefreshed } : { state: 'live' };

const renderMarker = (info: FreshnessInfo, copy: CacheCopy, variant: 'full' | 'icon' = 'full') =>
  info.state === 'cached' ? (
    <CacheMarker state="cached" detail={info.detail} copy={copy} variant={variant} />
  ) : (
    <CacheMarker state="live" copy={copy} variant={variant} />
  );

/**
 * Local agent-turn renderer. Mirrors @spotter's AgentMessage (avatar → typing →
 * reasoning → blocks) but renders the viz block through our `meta` slot so the
 * cache marker rides inside the answer card. The default AgentResponseBlock
 * can't carry it, which is the only reason we render the turn ourselves.
 */
const AgentTurn: React.FC<{
  message: ChatMessage;
  activeModel: SpotterModel;
  cacheVariant: CachePlacement;
  copyVariant: CacheCopy;
}> = ({ message, activeModel, cacheVariant, copyVariant }) => {
  const showTyping = message.stage === 'thinking' && !message.reasoning;
  return (
    <div className={styles.agentRow}>
      <span className={styles.agentAvatar} aria-hidden="true">
        <Icon name="ai" size="m" />
      </span>
      <div className={styles.agentBody}>
        {showTyping && <TypingIndicator />}
        <ReasoningBlock reasoning={message.reasoning} stage={message.stage} />
        {message.content?.blocks.map((block) => (
          <TurnBlock
            key={block.id}
            block={block}
            activeModel={activeModel}
            cacheVariant={cacheVariant}
            copyVariant={copyVariant}
          />
        ))}
      </div>
    </div>
  );
};

const TurnBlock: React.FC<{
  block: AnswerBlock;
  activeModel: SpotterModel;
  cacheVariant: CachePlacement;
  copyVariant: CacheCopy;
}> = ({ block, activeModel, cacheVariant, copyVariant }) => {
  switch (block.kind) {
    case 'viz': {
      const info = ANSWER_FRESHNESS[block.id] ?? modelFreshness(activeModel);
      const isHeaderIcon = cacheVariant === 'header-icon';
      const marker = renderMarker(info, copyVariant, isHeaderIcon ? 'icon' : 'full');
      return (
        <VizBlock
          block={block}
          meta={cacheVariant === 'above' ? marker : undefined}
          dataPointsLeading={cacheVariant === 'below' ? marker : undefined}
          headerActionsLeading={isHeaderIcon ? marker : undefined}
          onPin={() => {}}
          onSave={() => {}}
          onDownload={() => {}}
          onEdit={() => {}}
        />
      );
    }
    case 'text':
      return <TextBlock block={block} />;
    case 'followups':
      return <FollowUpsBlock block={block} />;
    default:
      return null;
  }
};
