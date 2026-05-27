import React from 'react';
import styles from './AgentMessage.module.css';

interface AgentMessageProps {
  children: React.ReactNode;
}

export const AgentMessage = React.forwardRef<HTMLDivElement, AgentMessageProps>(
  ({ children }, ref) => (
    <div className={styles.row} ref={ref}>
      <div className={styles.avatar}>
        <img src="/spotter-assets/SpotterModel avatar.svg" width="20" height="20" alt="SpotterModel" />
      </div>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  )
);
AgentMessage.displayName = 'AgentMessage';
