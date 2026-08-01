import React, { useMemo, useState } from 'react';
import { GlobalHeader } from '@components/GlobalHeader';
import { Modal } from '@components/Modal';
import {
  SpotterShell,
  SpotterLeftSide,
  SpotterRail,
  SpotterRailItem,
  SpotterPanel,
  SpotterPanelAction,
  SpotterPanelSection,
  SpotterPanelItem,
  SpotterLeftToggle,
  SpotterWelcome,
  SettingsMenu,
  ChatRowMenu,
  AnalystRowMenu,
  type SpotterLeftMode,
} from '@spotter/page';
import { SpotterChatProvider, useSpotterChat } from '@spotter/chat';
import type { SpotterPromptMode } from '@spotter/chat';
import { ChatCanvas } from './components/ChatCanvas';
import { AnalystLandingPage } from './components/AnalystLandingPage';
import { AnalystListPage } from './components/AnalystListPage';
import { PromptSuggestionsPanel } from './components/PromptSuggestionsPanel';
import {
  chats as initialChats,
  analysts,
  dataModels,
  type ChatEntry,
  type DataModel,
} from './data/mockData';

const USER_AVATAR_URL = 'https://i.pravatar.cc/64?img=47';

type ModalKey = 'instructions' | 'best-practices' | null;

/**
 * How Spotter should open. All optional — omitting every one gives the standalone
 * prototype exactly as before.
 *
 * These exist so Spotter can be embedded in another product's shell (Data Studio opens it
 * from "Test in Spotter" after publishing a model) and land in a specific state rather than
 * always starting on its own defaults.
 */
export interface SpotterProps {
  /**
   * Replaces Spotter's own header. Pass the host's header and the whole surface reads as
   * one product — the alternative is two headers with two personas either side of a click.
   */
  header?: React.ReactNode;
  /** 'rail' opens with the left menu collapsed. Defaults to the full panel. */
  initialLeftMode?: SpotterLeftMode;
  /** Extra models to offer in the picker — e.g. the model the host just published. */
  extraModels?: DataModel[];
  /** Which model to start on. Must be one of the built-ins or `extraModels`. */
  initialModelId?: string;
}

/**
 * Spotter prototype. Wraps the chat provider so any subtree using
 * `useSpotterChat()` can submit prompts and read state.
 */
export const Spotter: React.FC<SpotterProps> = (props) => {
  return (
    <SpotterChatProvider mode="canned">
      <SpotterInner {...props} />
    </SpotterChatProvider>
  );
};

const noop = (): void => {};

const SpotterInner: React.FC<SpotterProps> = ({ header, initialLeftMode, extraModels, initialModelId }) => {
  const [mode, setMode] = useState<SpotterLeftMode>(initialLeftMode ?? 'panel');
  const [selectedAnalyst, setSelectedAnalyst] = useState<string>('spotter-default');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [rightPaneOverride, setRightPaneOverride] = useState<'analyst-list' | null>(null);
  const [localChats, setLocalChats] = useState<ChatEntry[]>(initialChats);
  const [analystOrder, setAnalystOrder] = useState<string[]>(analysts.map((a) => a.id));
  const [promptValue, setPromptValue] = useState('');
  const [promptMode, setPromptMode] = useState<SpotterPromptMode>('ask');
  const [suggestionMode, setSuggestionMode] = useState<'quick-search' | 'deep-analysis' | null>(null);
  // A host-supplied model goes to the front of the list — it's the one the user just came
  // from, so it should read as the obvious choice, not be buried under the built-ins.
  const models = useMemo<DataModel[]>(
    () => (extraModels?.length ? [...extraModels, ...dataModels] : dataModels),
    [extraModels],
  );
  const [dataModelId, setDataModelId] = useState(initialModelId ?? models[0].id);
  const [personalMemoryEnabled, setPersonalMemoryEnabled] = useState(true);
  const [openModal, setOpenModal] = useState<ModalKey>(null);
  const [favoriteChats, setFavoriteChats] = useState<Set<string>>(new Set());

  const { state, send, clear, load } = useSpotterChat();

  const isChatActive = selectedChat !== null || state.messages.length > 0;
  const rightPane = isChatActive
    ? 'chat'
    : rightPaneOverride === 'analyst-list'
    ? 'analyst-list'
    : selectedAnalyst === 'spotter-default'
    ? 'welcome'
    : 'analyst-landing';

  const toggleMode = (): void => {
    setMode((prev) => (prev === 'rail' ? 'panel' : 'rail'));
  };

  const handleSubmit = (value: string): void => {
    setSuggestionMode(null);
    // Auto-name new chats on first message
    if (selectedChat === null) {
      const title = value.length > 45 ? `${value.slice(0, 45)}…` : value;
      const newId = `chat-${Date.now()}`;
      const newChat: ChatEntry = {
        id: newId,
        title,
        analystId: selectedAnalyst,
        messages: [],
      };
      setLocalChats((prev) => [newChat, ...prev]);
      setSelectedChat(newId);
      // Reorder analyst MRU only when a chat is actually started
      if (selectedAnalyst !== 'spotter-default') {
        setAnalystOrder((prev) => [selectedAnalyst, ...prev.filter((a) => a !== selectedAnalyst)]);
      }
    }
    send(value);
    setPromptValue('');
  };

  const handleQuickAction = (id: string): void => {
    if (id === 'quick-search' || id === 'deep-analysis') {
      // Toggle the suggestion panel — clicking the same button again closes it
      setSuggestionMode((prev) => (prev === id ? null : id));
      return;
    }
    if (id === 'know-your-data') {
      const text = 'Help me understand this data model and what can you do with it?';
      setPromptValue(text);
      requestAnimationFrame(() => { handleSubmit(text); });
    }
  };

  const handleSuggestionSelect = (text: string): void => {
    setSuggestionMode(null);
    setPromptValue(text);
    requestAnimationFrame(() => { handleSubmit(text); });
  };

  const handleNewChat = (): void => {
    clear();
    setPromptValue('');
    setSelectedChat(null);
    setRightPaneOverride(null);
    // Do NOT reset selectedAnalyst — keep current analyst selected
  };

  const handleAnalystClick = (id: string): void => {
    setSelectedAnalyst(id);
    setSelectedChat(null);
    clear();
    setRightPaneOverride(null);
    // Order is updated only when a chat is started, not on mere navigation
  };

  const handleChatClick = (chat: ChatEntry): void => {
    setSelectedChat(chat.id);
    setSelectedAnalyst(chat.analystId);
    setRightPaneOverride(null);
    load(chat.messages);
  };

  const handleToggleFavorite = (chatId: string): void => {
    setFavoriteChats((prev) => {
      const next = new Set(prev);
      if (next.has(chatId)) next.delete(chatId);
      else next.add(chatId);
      return next;
    });
  };

  const activeDataModel = models.find((m) => m.id === dataModelId) ?? models[0];

  const basePromptProps = {
    value: promptValue,
    onChange: setPromptValue,
    onSubmit: handleSubmit,
    mode: promptMode,
    onModeChange: setPromptMode,
  };

  // Default Spotter + chat canvas: show the data model picker
  const promptProps = {
    ...basePromptProps,
    dataModelLabel: activeDataModel.name,
    onDataModelClick: () => {
      const next = models[(models.indexOf(activeDataModel) + 1) % models.length];
      setDataModelId(next.id);
    },
  };

  // Named analyst landing pages: hide the data model picker
  const analystPromptProps = {
    ...basePromptProps,
    showDataModel: false,
  };

  const sortedAnalysts = [...analysts].sort(
    (a, b) => analystOrder.indexOf(a.id) - analystOrder.indexOf(b.id),
  );

  const activeAnalyst = analysts.find((a) => a.id === selectedAnalyst);

  const railContent = (
    <SpotterRail
      top={
        <>
          <SpotterLeftToggle mode={mode} onClick={toggleMode} />
          <SpotterRailItem icon="plus" label="New chat" onClick={handleNewChat} />
        </>
      }
      bottom={<SpotterRailItem icon="settings" label="Settings" />}
    />
  );

  const settingsButton = (
    <SettingsMenu
      onSpotterInstructions={() => setOpenModal('instructions')}
      onSpotterBestPractices={() => setOpenModal('best-practices')}
      usageMonitoringHref="https://thoughtspot.com/usage"
      adminSettingsHref="https://thoughtspot.com/admin"
      manageMemoryHref="https://thoughtspot.com/memory"
      personalMemoryEnabled={personalMemoryEnabled}
      onPersonalMemoryChange={setPersonalMemoryEnabled}
    >
      <SpotterPanelAction label="Settings" icon="settings" variant="flat" />
    </SettingsMenu>
  );

  const panelContent = (
    <SpotterPanel
      top={<SpotterLeftToggle mode={mode} onClick={toggleMode} />}
      primaryAction={
        <SpotterPanelAction
          label="New chat"
          icon="plus"
          onClick={handleNewChat}
        />
      }
      footer={settingsButton}
    >
      <SpotterPanelSection>
        <SpotterPanelItem
          label="Spotter (Default)"
          selected={selectedAnalyst === 'spotter-default' && rightPaneOverride !== 'analyst-list'}
          onClick={() => {
            setSelectedAnalyst('spotter-default');
            setSelectedChat(null);
            clear();
            setRightPaneOverride(null);
          }}
        />
      </SpotterPanelSection>

      <SpotterPanelSection label="Analysts">
        {sortedAnalysts.slice(0, 2).map((analyst) => (
          <AnalystRowMenu
            key={analyst.id}
            canEdit={analyst.canEdit}
            onEdit={noop}
            onShare={noop}
            onMakeCopy={noop}
            onDelete={noop}
          >
            <SpotterPanelItem
              label={analyst.name}
              selected={selectedAnalyst === analyst.id && rightPaneOverride !== 'analyst-list'}
              onClick={() => handleAnalystClick(analyst.id)}
            />
          </AnalystRowMenu>
        ))}
        <SpotterPanelItem
          label="View all"
          trailingIcon="chevron-right"
          selected={rightPaneOverride === 'analyst-list'}
          onClick={() => setRightPaneOverride('analyst-list')}
        />
      </SpotterPanelSection>

      <SpotterPanelSection label="Chats">
        {localChats.map((chat) => (
          <ChatRowMenu
            key={chat.id}
            isFavorite={favoriteChats.has(chat.id)}
            onRename={noop}
            onToggleFavorite={() => handleToggleFavorite(chat.id)}
            onShare={noop}
            onDelete={noop}
          >
            <SpotterPanelItem
              label={chat.title}
              selected={selectedChat === chat.id}
              onClick={() => handleChatClick(chat)}
            />
          </ChatRowMenu>
        ))}
      </SpotterPanelSection>
    </SpotterPanel>
  );

  return (
    <>
      <SpotterShell
        /* A host can supply its own header so the surface reads as one product. Without
           it, Spotter keeps its own — the standalone prototype is unchanged. */
        header={
          header ?? (
            <GlobalHeader
              theme="light"
              showHamburger
              onHamburgerClick={toggleMode}
              searchPlaceholder="Search in your library"
              showKeyboardHint={false}
              notificationCount={1}
              userName="Alex"
              userAvatar={USER_AVATAR_URL}
            />
          )
        }
        leftSide={
          <SpotterLeftSide
            mode={mode}
            onToggle={toggleMode}
            rail={railContent}
            panel={panelContent}
          />
        }
      >
        {rightPane === 'welcome' && (
          <SpotterWelcome
            promptProps={promptProps}
            quickActions={
              suggestionMode ? (
                <PromptSuggestionsPanel
                  mode={suggestionMode}
                  onSelect={handleSuggestionSelect}
                  onClose={() => setSuggestionMode(null)}
                />
              ) : undefined
            }
            quickActionProps={{ onAction: handleQuickAction }}
          />
        )}
        {rightPane === 'chat' && (
          <ChatCanvas
            messages={state.messages}
            promptProps={promptProps}
            userAvatarUrl={USER_AVATAR_URL}
            userInitial="A"
            agentAvatarIcon="ai"
          />
        )}
        {rightPane === 'analyst-landing' && (
          <AnalystLandingPage
            analystName={activeAnalyst?.name ?? selectedAnalyst}
            promptProps={analystPromptProps}
          />
        )}
        {rightPane === 'analyst-list' && (
          <AnalystListPage
            analysts={analysts}
            onAnalystClick={(id) => handleAnalystClick(id)}
            onCreateNew={noop}
          />
        )}
      </SpotterShell>

      <Modal
        isOpen={openModal === 'instructions'}
        onClose={() => setOpenModal(null)}
        title="Spotter instructions"
        size="M2"
      >
        <p>
          Configure how Spotter responds to your questions. Add custom instructions
          that apply across all chats — tone, format preferences, domains to favor.
        </p>
      </Modal>

      <Modal
        isOpen={openModal === 'best-practices'}
        onClose={() => setOpenModal(null)}
        title="Spotter best practices"
        size="M2"
      >
        <p>
          Tips for getting the most out of Spotter — how to phrase questions,
          when to use refine, and how to verify answers against your sources.
        </p>
      </Modal>
    </>
  );
};

export default Spotter;
