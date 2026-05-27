import React from 'react';
import type { ChatMessage } from '../runtime/schema';
import styles from './UserBubble.module.css';

export interface UserBubbleProps {
  message: ChatMessage;
  /** Optional avatar URL. Defaults to a fallback initial. */
  avatarUrl?: string;
  /** Initial used in the fallback when no avatar URL is provided. */
  initial?: string;
}

const formatTimestamp = (ts: number): string => {
  const d = new Date(ts);
  const hours12 = d.getHours() % 12 || 12;
  const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
  const time = `${String(hours12).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${ampm}`;
  const date = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  return `${time}, ${date}`;
};

export const UserBubble: React.FC<UserBubbleProps> = ({
  message,
  avatarUrl,
  initial = 'A',
}) => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.row}>
        <div className={styles.avatar} aria-hidden="true">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className={styles.avatarImg} />
          ) : (
            <span className={styles.avatarFallback}>{initial}</span>
          )}
        </div>
        <p className={styles.text}>{message.text}</p>
      </div>
      <span className={styles.timestamp}>{formatTimestamp(message.createdAt)}</span>
    </div>
  );
};

UserBubble.displayName = 'UserBubble';

export default UserBubble;
