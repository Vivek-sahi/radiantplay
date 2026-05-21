import React from 'react';
import { spotterGlow } from '../tokens';
import { SpotterPrompt } from '../chat/SpotterPrompt';
import type { SpotterPromptProps } from '../chat/SpotterPrompt';
import { QuickActionRow } from '../chat/QuickActionRow';
import type { QuickActionRowProps } from '../chat/QuickActionRow';
import styles from './SpotterWelcome.module.css';

export interface SpotterWelcomeProps {
  /**
   * Greeting text. Pass a string for the default style, or a node for full
   * control. Default: "Lets make sense of your data together." with the
   * accent phrase highlighted.
   */
  greeting?: React.ReactNode;
  /**
   * Override the prompt slot entirely. When omitted, renders SpotterPrompt
   * with the props from `promptProps`.
   */
  prompt?: React.ReactNode;
  promptProps?: SpotterPromptProps;
  /**
   * Override the quick actions slot. When omitted, renders QuickActionRow
   * with the props from `quickActionProps`.
   */
  quickActions?: React.ReactNode;
  quickActionProps?: QuickActionRowProps;
  className?: string;
}

const DefaultGreeting: React.FC = () => (
  <h1 className={styles.greeting}>
    Lets <span className={styles.greetingAccent}>make sense</span> of your data together.
  </h1>
);

export const SpotterWelcome: React.FC<SpotterWelcomeProps> = ({
  greeting,
  prompt,
  promptProps,
  quickActions,
  quickActionProps,
  className,
}) => {
  const classes = [styles.welcome, className].filter(Boolean).join(' ');
  const styleVars = {
    ['--spotter-glow-from' as string]: spotterGlow.from,
    ['--spotter-glow-to' as string]: spotterGlow.to,
  } as React.CSSProperties;

  return (
    <section className={classes} style={styleVars}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.content}>
        {greeting ?? <DefaultGreeting />}
        {prompt ?? <SpotterPrompt {...promptProps} />}
        {quickActions ?? <QuickActionRow {...quickActionProps} />}
      </div>
    </section>
  );
};

SpotterWelcome.displayName = 'SpotterWelcome';

export default SpotterWelcome;
