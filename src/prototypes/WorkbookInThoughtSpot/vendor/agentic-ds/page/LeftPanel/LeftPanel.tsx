import React, { useState } from 'react';
import { Icon } from '@components/icons';
import { analysts, chats as sampleChats, firstChatFor, type Chat } from './data';
import { AnalystAvatar } from './AnalystAvatar';
import { Collapsible } from './Collapsible';
import { NavListItem } from './NavListItem';
import type { AttentionMotion } from './NavListItem';
import { NavSectionHeader } from './NavSectionHeader';
import { PanelIconButton } from './PanelIconButton';
import type { RowMenuOption } from './RowMenu';
import { SettingsMenu } from './SettingsMenu';
import { ComposeIcon, PanelToggleIcon } from './icons';
import styles from './LeftPanel.module.css';

export interface LeftPanelProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  /**
   * The highlighted analyst row, or `null` for none. Optional — omit and the
   * panel manages it, which is what the standalone prototype does.
   *
   * Only one row in the panel is ever highlighted, so this and `activeChatId`
   * are mutually exclusive: an analyst is highlighted when you are on its zero
   * state, and opening a chat is exactly what takes the highlight off it. Which
   * analyst an open chat belongs to is a different question, answered by the
   * chat's own `analystId` and shown in the canvas header — not here.
   *
   * Keeping the two exclusive means one click reports through both callbacks:
   * the row that was picked, and a `null` for the side that gave up its
   * highlight. A null is never a pick — a host that acts on it undoes the
   * selection that caused it.
   */
  activeId?: string | null;
  onActiveIdChange?: (id: string | null) => void;
  /**
   * The selected chat, or `null` for none.
   *
   * The three states a host can be in:
   *   - a chat is open → `activeChatId` set, `activeId` null
   *   - an analyst's zero state → `activeId` set, `activeChatId` null
   *   - a settings surface such as Connectors → both `null`
   */
  activeChatId?: string | null;
  onActiveChatIdChange?: (id: string | null) => void;
  /** Fired by the New chat row. Hosts that own conversation state use it to
   *  clear the canvas. */
  onNewChat?: () => void;
  /** Fired by "Show all Analysts", which clears the selection entirely. */
  onShowAllAnalysts?: () => void;
  /** Fired by a settings menu row, with its label. Connectors and the other
   *  destinations leave the panel with nothing selected. */
  onSettingsSelect?: (label: string) => void;
  /**
   * The chat list. Omit for the built-in sample.
   *
   * A host that lets the user start conversations passes its own, so a new one
   * can appear here the moment it is created.
   */
  chats?: Chat[];
  /**
   * Chat ids with something waiting on the user — an unanswered clarifying
   * question, say. Each gets a dot beside its name, so a conversation that needs
   * you is findable after you've navigated away from it.
   */
  attentionChatIds?: string[];
  /** Tuning for the attention dot's motion. Omit for the CSS defaults. */
  attentionMotion?: AttentionMotion;
}

/** Hard cap — the list never grows past three. "Show all Analysts" navigates
 *  to the full list rather than expanding this one. */
const MAX_VISIBLE_ANALYSTS = 3;

const CHAT_MENU: RowMenuOption[] = [
  { label: 'Pin chat' },
  { label: 'Rename' },
  { label: 'Share' },
  { label: 'Delete', destructive: true },
];

const ANALYST_MENU: RowMenuOption[] = [
  { label: 'Make a copy' },
  { label: 'Delete', destructive: true },
];

/**
 * Spotter left panel.
 *
 * Expanded and collapsed render from a single tree — the panel toggle, new chat
 * row, and settings button are the same elements in both states, which is what
 * holds their y position steady through the collapse. The width, row insets,
 * and leading-slot size animate; everything else fades. See LeftPanel.module.css
 * for the geometry notes.
 */
export const LeftPanel: React.FC<LeftPanelProps> = ({
  collapsed,
  onCollapsedChange,
  activeId: controlledActiveId,
  onActiveIdChange,
  activeChatId: controlledChatId,
  onActiveChatIdChange,
  onNewChat,
  onShowAllAnalysts,
  onSettingsSelect,
  chats = sampleChats,
  attentionChatIds,
  attentionMotion,
}) => {
  const [analystsOpen, setAnalystsOpen] = useState(true);
  const [chatsOpen, setChatsOpen] = useState(true);
  // Opens on a conversation, which means the chat row carries the only
  // highlight — see the single-selection note on the click handlers.
  const [uncontrolledAnalystId, setUncontrolledAnalystId] = useState<string | null>(null);
  const [uncontrolledChatId, setUncontrolledChatId] = useState<string | null>(
    () => firstChatFor('spotter')?.id ?? null
  );

  // `undefined` means uncontrolled; `null` is a real "nothing selected".
  const selectedAnalystId =
    controlledActiveId !== undefined ? controlledActiveId : uncontrolledAnalystId;
  const selectedChatId =
    controlledChatId !== undefined ? controlledChatId : uncontrolledChatId;

  const selectAnalyst = (id: string | null) => {
    if (controlledActiveId === undefined) setUncontrolledAnalystId(id);
    onActiveIdChange?.(id);
  };

  const selectChat = (id: string | null) => {
    if (controlledChatId === undefined) setUncontrolledChatId(id);
    onActiveChatIdChange?.(id);
  };

  // ── One selection, not two ──────────────────────────────────────────────────
  // A click lights exactly one row and reports through exactly one callback.
  //
  // This panel used to move both together: picking an analyst also opened its
  // most recent chat, and picking a chat also lit its analyst. Two highlights
  // for one click read as two things being open, and it left every host
  // untangling which of the two callbacks the user had actually triggered. The
  // analyst an open chat belongs to is shown in the canvas header instead.

  /** An analyst's zero state — a place to ask, with no conversation open yet. */
  const handleAnalystClick = (id: string) => {
    selectAnalyst(id);
    selectChat(null);
  };

  /** Opening a conversation. The analyst row gives up its highlight. */
  const handleChatClick = (chat: Chat) => {
    selectChat(chat.id);
    selectAnalyst(null);
  };

  /** The full Analysts list is its own destination, outside both sections, so
   *  neither keeps a highlight. */
  const handleShowAllAnalysts = () => {
    selectAnalyst(null);
    selectChat(null);
    onShowAllAnalysts?.();
  };

  /** A new conversation is a zero state of its own, under no analyst yet. */
  const handleNewChat = () => {
    selectChat(null);
    selectAnalyst(null);
    onNewChat?.();
  };

  /** In-app settings destinations (Connectors, Spotter instructions) sit outside
   *  the analyst/chat hierarchy, so nothing stays highlighted. External rows
   *  open a different surface and leave this panel's selection alone. */
  const handleSettingsSelect = (label: string, external: boolean) => {
    if (!external) {
      selectAnalyst(null);
      selectChat(null);
    }
    onSettingsSelect?.(label);
  };

  const visibleAnalysts = analysts.slice(0, MAX_VISIBLE_ANALYSTS);

  return (
    <nav
      className={[styles.panel, collapsed ? styles.collapsed : ''].filter(Boolean).join(' ')}
      aria-label="Spotter"
    >
      <div className={styles.header}>
        <h2 className={styles.title} aria-hidden={collapsed}>
          Spotter
        </h2>
        <PanelIconButton
          label={collapsed ? 'Expand panel' : 'Collapse panel'}
          onClick={() => onCollapsedChange(!collapsed)}
        >
          <PanelToggleIcon size="m" />
        </PanelIconButton>
      </div>

      <div className={styles.list}>
        {/* New chat persists across both states — its icon holds x 24 / y 88. */}
        <div className={styles.section}>
          <NavListItem
            leading={<ComposeIcon size="m" />}
            label="New chat"
            secondaryLeading
            onClick={handleNewChat}
          />
        </div>

        <div className={`${styles.section} ${styles.hideOnCollapse}`}>
          <NavSectionHeader
            label="Analysts"
            open={analystsOpen}
            onToggle={() => setAnalystsOpen((open) => !open)}
          />
          <Collapsible open={analystsOpen}>
            {visibleAnalysts.map((analyst) => (
              <NavListItem
                key={analyst.id}
                leading={<AnalystAvatar avatar={analyst.avatar} />}
                label={analyst.name}
                active={selectedAnalystId === analyst.id}
                onClick={() => handleAnalystClick(analyst.id)}
                /* Spotter is the built-in analyst — nothing to copy or delete. */
                menuOptions={analyst.isDefault ? undefined : ANALYST_MENU}
              />
            ))}
            {/* A navigational row, not a disclosure — it routes to the full
                Analysts list rather than growing this one. */}
            <NavListItem
              leading={<Icon name="more" size="m" />}
              label="Show all Analysts"
              secondaryLeading
              onClick={handleShowAllAnalysts}
            />
          </Collapsible>
        </div>

        <div className={`${styles.section} ${styles.hideOnCollapse}`}>
          <NavSectionHeader
            label="My chats"
            open={chatsOpen}
            onToggle={() => setChatsOpen((open) => !open)}
          />
          <Collapsible open={chatsOpen}>
            {chats.map((chat) => (
              <NavListItem
                key={chat.id}
                label={chat.title}
                active={selectedChatId === chat.id}
                needsAttention={attentionChatIds?.includes(chat.id)}
                attentionMotion={attentionMotion}
                onClick={() => handleChatClick(chat)}
                menuOptions={CHAT_MENU}
              />
            ))}
          </Collapsible>
        </div>
      </div>

      <div className={styles.footer}>
        <SettingsMenu collapsed={collapsed} onSelect={handleSettingsSelect} />
      </div>
    </nav>
  );
};

export default LeftPanel;
