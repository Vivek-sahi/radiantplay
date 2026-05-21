import React from 'react';
import { spotterGlow } from '@spotter/tokens';
import { SpotterPrompt } from '@spotter/chat';
import type { SpotterPromptProps } from '@spotter/chat';
import styles from './AnalystLandingPage.module.css';

export interface AnalystLandingPageProps {
  analystName: string;
  promptProps?: SpotterPromptProps;
}

export const AnalystLandingPage: React.FC<AnalystLandingPageProps> = ({
  analystName,
  promptProps,
}) => {
  const initial = analystName.charAt(0).toUpperCase();

  const styleVars = {
    ['--spotter-glow-from' as string]: spotterGlow.from,
    ['--spotter-glow-to' as string]: spotterGlow.to,
  } as React.CSSProperties;

  return (
    <section className={styles.page} style={styleVars}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.content}>
        <div className={styles.avatar} aria-hidden="true">
          <span className={styles.avatarInitial}>{initial}</span>
        </div>
        <h1 className={styles.heading}>Hi, I'm {analystName}</h1>
        <SpotterPrompt
          {...promptProps}
          placeholder={`Ask ${analystName} anything about your data`}
        />
      </div>
    </section>
  );
};

AnalystLandingPage.displayName = 'AnalystLandingPage';

export default AnalystLandingPage;
