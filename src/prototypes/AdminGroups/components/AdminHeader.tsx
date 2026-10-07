import React from 'react';
import { Avatar } from '../../../components/Avatar';
import { Icon } from '../../../components/icons';
import { headerStyles as styles } from '../styles';
import { sysVar } from '../../../tokens/colors';

// Custom bell icon
const BellIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.5 6C13.5 4.80653 13.0259 3.66193 12.182 2.81802C11.3381 1.97411 10.1935 1.5 9 1.5C7.80653 1.5 6.66193 1.97411 5.81802 2.81802C4.97411 3.66193 4.5 4.80653 4.5 6C4.5 11.25 2.25 12.75 2.25 12.75H15.75C15.75 12.75 13.5 11.25 13.5 6Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.2975 15.75C10.1657 15.9773 9.9764 16.166 9.74871 16.2971C9.52103 16.4283 9.26277 16.4973 9 16.4973C8.73723 16.4973 8.47897 16.4283 8.25129 16.2971C8.0236 16.166 7.8343 15.9773 7.7025 15.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/**
 * AdminHeader Component
 * 
 * Top navigation bar for the Admin Groups prototype.
 * Includes: ThoughtSpot logo, search bar, help, notifications, and user avatar.
 */
export const AdminHeader: React.FC = () => {
  return (
    <header style={styles.container}>
      {/* Left section: Logo */}
      <div style={styles.left}>
        {/* ThoughtSpot Logo. Brand mark colours are data, kept as literals. */}
        <div style={styles.logo}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M4 4h7v7H4V4z" fill="#48D1E0" />
            <path d="M13 4h7v7h-7V4z" fill="#2770EF" />
            <path d="M4 13h7v7H4v-7z" fill="#2770EF" />
            <path d="M13 13h7v7h-7v-7z" fill="#48D1E0" />
          </svg>
        </div>
      </div>

      {/* Center section: Search */}
      <div style={styles.center}>
        <div style={styles.searchContainer}>
          <div style={{ position: 'relative' }}>
            <span style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: sysVar('content-tertiary'),
                display: 'flex',
              }}>
              <Icon name="magnifying-glass" size="s" />
            </span>
            <input
              type="text"
              placeholder="Search"
              style={styles.searchInput}
            />
          </div>
        </div>
      </div>

      {/* Right section: Icons and Avatar */}
      <div style={styles.right}>
        <div style={styles.iconButton}>
          <Icon name="question-mark" size="s" />
        </div>
        <div style={{ ...styles.iconButton, position: 'relative' as const }}>
          <BellIcon />
          <span style={styles.notificationDot as React.CSSProperties} />
        </div>
        <Avatar name="Admin User" size="s" />
      </div>
    </header>
  );
};

export default AdminHeader;
