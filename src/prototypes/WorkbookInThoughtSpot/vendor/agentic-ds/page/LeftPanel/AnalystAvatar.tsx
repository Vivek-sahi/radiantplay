import React from 'react';
import type { AnalystAvatar as AnalystAvatarSpec } from './data';
import { SpotterMark } from './icons';
import styles from './LeftPanel.module.css';

export interface AnalystAvatarProps {
  avatar: AnalystAvatarSpec;
}

/**
 * 16px avatar for an analyst row — the Spotter mark for the built-in agent,
 * a tinted monogram for custom analysts.
 */
export const AnalystAvatar: React.FC<AnalystAvatarProps> = ({ avatar }) => {
  if (avatar.kind === 'spotter') {
    return <SpotterMark pixelSize={20} />;
  }

  return (
    <span
      className={[
        styles.monogram,
        avatar.tone === 'purple' ? styles.monogramPurple : styles.monogramBlue,
      ].join(' ')}
      aria-hidden
    >
      {avatar.letter}
    </span>
  );
};

export default AnalystAvatar;
