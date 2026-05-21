import React, { useState } from 'react';
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
import { ChatCanvas } from './components/ChatCanvas';
import { AnalystLandingPage } from './components/AnalystLandingPage';
import { AnalystListPage } from './components/AnalystListPage';
import {
  chats as initialChats,
  analysts,
  dataModels,
  type ChatEntry,
} from './data/mockData';

const USER_AVATAR_URL = 'https://i.pravatar.cc/64?img=47';

type ModalKey = 'instructions' | 'best-practices' | null;

/**
 * Spotter prototype. Wraps the chat provider so any subtree using
 * `useSpotterChat()` can submit prompts and read state.
 */
export const Spotter: React.FC = () => {
  return (
    <SpotterChatProvider mode="canned">
      <SpotterInner />
    </SpotterChatProvider>
  );
};

const noop = (): void => {};

const SpotterInner: React.FC = () => {
  const [mode, setMode] = useState<SpotterLeftMode>('panel');
  const [selectedAnalyst, setSelectedAnalyst] = useState<string>('spotter-default');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [rightPaneOverride, setRightPaneOverride] = useState<'analyst-list' | null>(null);
  const [localChats, setLocalChats] = useState<ChatEntry[]>(initialChats);
  const [analystOrder, setAnalystOrder] = useState<string[]>(analysts.map((a) => a.id));
  const [promptValue, setPromptValue] = useState('');
  const [dataModelId, setDataModelId] = useState(dataModels[0].id);
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
    const promptByAction: Record<string, string> = {
      'quick-search': 'Show me total sales by month',
      'deep-analysis': 'Analyze sales for the upcoming fall and winter season',
      'know-your-data': 'What are the most common questions asked about this data?',
    };
    const text = promptByAction[id];
    if (!text) return;
    setPromptValue(text);
    requestAnimationFrame(() => {
      handleSubmit(text);
    });
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

  const activeDataModel = dataModels.find((m) => m.id === dataModelId) ?? dataModels[0];

  const promptProps = {
    value: promptValue,
    onChange: setPromptValue,
    onSubmit: handleSubmit,
    dataModelLabel: activeDataModel.name,
    onDataModelClick: () => {
      const next = dataModels[(dataModels.indexOf(activeDataModel) + 1) % dataModels.length];
      setDataModelId(next.id);
    },
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
        header={
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
            promptProps={promptProps}
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
