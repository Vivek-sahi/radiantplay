import React from 'react';
import styles from './UserBubble.module.css';

interface UserBubbleProps {
  text: string;
}

export const UserBubble = React.forwardRef<HTMLDivElement, UserBubbleProps>(
  ({ text }, ref) => (
    <div className={styles.group} ref={ref}>
      <div className={styles.bubble}>
        <div className={styles.avatar}>
          <img src="/spotter-assets/User avatar.png" alt="User" />
        </div>
        <div className={styles.text}>{text}</div>
      </div>
      <div className={styles.timestamp} />
    </div>
  )
);
UserBubble.displayName = 'UserBubble';
