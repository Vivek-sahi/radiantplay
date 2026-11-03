import React from 'react';
import { Icon } from '@components/icons';
import PromptBarCore, { type PromptBarCoreProps } from '../chat/PromptBar';
import { RadianceBackground } from '@/app-chrome/RadianceBackground/RadianceBackground';
import { SpotterMark } from './LeftPanel/icons';
import type { AnalystAvatar } from './LeftPanel/data';
import styles from './AnalystLanding.module.css';

export interface AnalystLandingProps {
  /** The same avatar spec the nav row uses, so identity carries across surfaces. */
  avatar: AnalystAvatar;
  /** Rendered as "Hi, I'm {name}". */
  name: string;
  /** One or two lines on what this analyst is for. */
  description: string;
  /** Starter questions under the prompt bar. Omit and the block isn't rendered. */
  starterPrompts?: string[];
  onSelectPrompt?: (prompt: string) => void;
  promptProps?: PromptBarCoreProps;
  /**
   * Changing this replays the entry motion.
   *
   * Keyed onto the content only, never the landing root — the glow is a sibling
   * there, and remounting it would cost the ~450ms canvas init on every switch,
   * which is exactly what deferring its mount was meant to stop.
   */
  replayKey?: string | number;
  /**
   * Paint the Radiance glow behind the page.
   *
   * On by default. It is a continuously animating canvas, so it costs main
   * thread for as long as it is on screen — worth an escape hatch on machines
   * where that is felt.
   */
  showGlow?: boolean;
}

/**
 * A custom analyst's zero state.
 *
 * An analyst is a subagent of Spotter with a deliberately narrowed context, so
 * this page has to answer two questions before the user spends a turn finding
 * out: what it is for (the description) and what it takes (the starters).
 *
 * Default Spotter has neither constraint and gets `SpotterLanding` instead.
 */
export const AnalystLanding: React.FC<AnalystLandingProps> = ({
  avatar,
  name,
  description,
  starterPrompts = [],
  onSelectPrompt,
  promptProps,
  replayKey,
  showGlow = true,
}) => (
  <div className={styles.landing}>
    {showGlow && <RadianceBackground pattern="home" />}

    <div key={`column-${replayKey}`} className={styles.column}>
      <div className={styles.hero}>
        {avatar.kind === 'spotter' ? (
          <SpotterMark pixelSize={48} />
        ) : (
          <span
            className={`${styles.avatar} ${
              avatar.tone === 'purple' ? styles.avatarPurple : styles.avatarBlue
            }`}
            aria-hidden
          >
            {avatar.letter}
          </span>
        )}

        <h1 className={styles.greeting}>Hi, I’m {name}</h1>
        <p className={styles.description}>{description}</p>
      </div>

      <div className={styles.promptArea}>
        {/* `showModelPicker` sits after the spread deliberately: an analyst is
            configured against a fixed set of data models, so there is nothing
            for the user to pick. That is a property of the surface, not the
            host's call, so the button is omitted rather than shown inert. */}
        <PromptBarCore minLines={2} {...promptProps} showModelPicker={false} />
      </div>

      {starterPrompts.length > 0 && (
        <div className={styles.starters}>
          {starterPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className={styles.starter}
              onClick={() => onSelectPrompt?.(prompt)}
            >
              <span className={styles.starterIcon}>
                <Icon
                  name="follow-up"
                  size="s"
                  color="var(--rd-sys-color-content-secondary)"
                />
              </span>
              <span>{prompt}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  </div>
);

AnalystLanding.displayName = 'AnalystLanding';

export default AnalystLanding;
