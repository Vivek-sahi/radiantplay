import React from 'react';
import { sysVar } from '../../tokens/colors';
import styles from './Tabs.module.css';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

/**
 * Tabs Component
 * 
 * A navigation component for switching between different views/sections.
 * 
 * @example
 * ```tsx
 * <Tabs 
 *   tabs={[
 *     { id: 'chips', label: 'Chips' },
 *     { id: 'alerts', label: 'Alerts' }
 *   ]}
 *   activeTab="chips"
 *   onTabChange={(id) => setActiveTab(id)}
 * />
 * ```
 */
export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className,
}) => {
  return (
    <nav className={`${styles.tabs} ${className || ''}`} role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            className={`${styles.tab} ${isActive ? styles.active : ''}`}
            onClick={() => onTabChange(tab.id)}
            style={{
              color: isActive ? sysVar('content-brand') : sysVar('content-secondary'),
              borderBottomColor: isActive ? sysVar('content-brand') : 'transparent',
            }}
          >
            {tab.icon && <span className={styles.icon}>{tab.icon}</span>}
            <span className={styles.label}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default Tabs;

