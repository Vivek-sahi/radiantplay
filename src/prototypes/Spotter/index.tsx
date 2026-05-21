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
import {
  chats,
  analysts,
  dataModels,
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
  const [selectedAnalyst, setSelectedAnalyst] = useState<string | null>(null);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [promptValue, setPromptValue] = useState('');
  const [dataModelId, setDataModelId] = useState(dataModels[0].id);
  const [personalMemoryEnabled, setPersonalMemoryEnabled] = useState(true);
  const [openModal, setOpenModal] = useState<ModalKey>(null);
  const [favoriteChats, setFavoriteChats] = useState<Set<string>>(new Set());

  const { state, send, clear, load } = useSpotterChat();
  const isEmpty = state.messages.length === 0;

  const toggleMode = (): void => {
    setMode((prev) => (prev === 'rail' ? 'panel' : 'rail'));
  };

  const handleSubmit = (value: string): void => {
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
    // Pre-fill the input so the user sees what's being sent, then submit
    setPromptValue(text);
    requestAnimationFrame(() => {
      send(text);
      setPromptValue('');
    });
  };

  const handleNewChat = (): void => {
    clear();
    setPromptValue('');
    setSelectedChat(null);
    setSelectedAnalyst(null);
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
      <SpotterPanelAction label="Settings" icon="settings" />
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
      <SpotterPanelSection label="Analysts">
        {analysts.slice(0, 2).map((analyst) => (
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
              selected={selectedAnalyst === analyst.id}
              onClick={() => {
                setSelectedAnalyst(analyst.id);
                setSelectedChat(null);
                clear();
              }}
            />
          </AnalystRowMenu>
        ))}
        <SpotterPanelItem
          label="View all"
          trailingIcon="chevron-right"
          selected={selectedAnalyst === 'list'}
          onClick={() => setSelectedAnalyst('list')}
        />
      </SpotterPanelSection>

      <SpotterPanelSection label="Chats">
        {chats.map((chat) => (
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
              onClick={() => {
                setSelectedChat(chat.id);
                setSelectedAnalyst(null);
                load(chat.messages);
              }}
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
        {isEmpty ? (
          <SpotterWelcome
            promptProps={promptProps}
            quickActionProps={{ onAction: handleQuickAction }}
          />
        ) : (
          <ChatCanvas
            messages={state.messages}
            promptProps={promptProps}
            userAvatarUrl={USER_AVATAR_URL}
            userInitial="A"
            agentAvatarIcon="ai"
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
