import React, { useRef } from 'react';
import PromptBarCore, { type PromptBarCoreProps } from '../chat/PromptBar';
import { RadianceBackground } from '@/app-chrome/RadianceBackground/RadianceBackground';
import { StarterChips, type StarterChip } from './StarterChips';
import styles from './SpotterLanding.module.css';

export interface SpotterLandingProps {
  /** Props forwarded to the prompt bar. */
  promptProps?: PromptBarCoreProps;
  /** Override the three starter chips. */
  chips?: StarterChip[];
  /** A suggestion inside an expanded starter card was picked. */
  onSelectPrompt?: (prompt: string, chipId: string) => void;
  /** Optional trailing content for each suggestion row — see StarterChips. */
  renderPromptTrailing?: (prompt: string, chipId: string) => React.ReactNode;
  /** A chip with no suggestions was clicked. */
  onChipSelect?: (chipId: string) => void;
  /** Hide the "responses should be reviewed" line. */
  hideDisclaimer?: boolean;
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
 * Spotter's zero state — what the canvas shows before the first question.
 *
 * Opens with a capability statement and three modes rather than a form,
 * because Spotter can reach everything and the useful thing to say is what
 * kinds of question it takes. Two of the modes expand into suggestions; "know
 * your data" is its own answer and stays a plain chip.
 *
 * The glow behind it is Radiance's `home` product pattern, through the shared
 * RadianceBackground (see .claude/skills/rp-radiance/SKILL.md).
 */
export const SpotterLanding: React.FC<SpotterLandingProps> = ({
  promptProps,
  chips,
  onSelectPrompt,
  renderPromptTrailing,
  onChipSelect,
  hideDisclaimer,
  replayKey,
  showGlow = true,
}) => {
  const promptRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className={styles.landing}>
      {showGlow && <RadianceBackground pattern="home" />}

      <div key={`hero-${replayKey}`} className={styles.hero}>
        <p className={styles.title}>
          Let’s <span className={styles.brand}>make sense</span> of your data together.
        </p>
      </div>

      <div key={`column-${replayKey}`} className={styles.column}>
        <div ref={promptRef} className={styles.promptArea}>
          <PromptBarCore minLines={2} placeholder="Enter your question" {...promptProps} />
        </div>

        <div className={styles.chipsArea}>
          <StarterChips
            chips={chips}
            anchorRef={promptRef}
            onSelect={onSelectPrompt}
            onChipSelect={onChipSelect}
            renderPromptTrailing={renderPromptTrailing}
          />
        </div>
      </div>

      {/* Pinned to the bottom of the canvas, not trailing the chips — it is a
          standing notice about the surface, not a caption for the prompt. */}
      {!hideDisclaimer && (
        <p key={`disclaimer-${replayKey}`} className={styles.disclaimer}>
          You are interacting with an AI system. Responses should be reviewed.{' '}
          <a
            className={styles.disclaimerLink}
            href="#"
            onClick={(e) => e.preventDefault()}
          >
            Learn more
          </a>
        </p>
      )}
    </div>
  );
};

SpotterLanding.displayName = 'SpotterLanding';

export default SpotterLanding;
