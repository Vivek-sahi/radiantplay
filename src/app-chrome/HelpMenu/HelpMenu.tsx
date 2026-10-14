import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ActionMenu } from '../../components/ActionMenu';
import { Icon } from '../../components/icons';
import { GUIDES } from '../guides';
import { getCurrentVersion } from '../../data/versionHistory';
import styles from './HelpMenu.module.css';

/**
 * HelpMenu - one "Help" link at the bottom of the playground's and the design system's left panes.
 * It opens a menu as wide as the pane: Updates (What's new, the changelog, with the current version) and
 * Guides (static pages served from public/, each opened in a new tab). The design system's old version button
 * lives here now.
 */
export const HelpMenu: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className={styles.wrap}>
      <ActionMenu
        placement="top-start"
        trigger={
          <button type="button" className={styles.trigger}>
            <Icon name="question-mark" size="s" />
            <span className={styles.label}>Help</span>
          </button>
        }
      >
        <ActionMenu.Group label="Updates">
          <ActionMenu.Item
            label="What's new"
            icon={<Icon name="info-circle" size="s" />}
            shortcut={getCurrentVersion()}
            onClick={() => navigate('/radiant/changelog')}
          />
        </ActionMenu.Group>
        <ActionMenu.Group label="Guides">
          {GUIDES.map((g) => (
            <ActionMenu.Item
              key={g.id}
              label={g.label}
              icon={<Icon name={g.icon} size="s" />}
              shortcut="↗"
              onClick={() => { window.open(g.href, '_blank', 'noopener,noreferrer'); }}
            />
          ))}
        </ActionMenu.Group>
      </ActionMenu>
    </div>
  );
};

export default HelpMenu;
