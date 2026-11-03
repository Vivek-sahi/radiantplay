import React, { useEffect, useRef, useState } from 'react';
import { RowMenu } from './RowMenu';
import type { RowMenuOption } from './RowMenu';
import styles from './LeftPanel.module.css';

/**
 * Tuning for the attention dot's motion. Supplied by a host that wants to drive it
 * (the prototype's control rig); omitted, the dot uses the CSS defaults.
 *
 * Scripted rather than declared because a keyframe's OFFSET can't come from a
 * custom property — and the peak's position in the timeline is one of the things
 * worth tuning.
 */
export interface AttentionMotion {
  /** The overshoot-and-land on arrival. Off means it just appears. */
  arrival: boolean;
  /** Time from nothing to the overshoot. */
  outMs: number;
  /** Time from the overshoot down onto the resting width. */
  settleMs: number;
  /** Slot width at the overshoot. Wider than `restPx` is the overshoot. */
  overshootPx: number;
  /** Slot width it lands on. 12 holds the 8px dot with 2px of slack either side. */
  restPx: number;
  /** Any CSS easing — a keyword or a cubic-bezier(). */
  outEase: string;
  settleEase: string;
  /** Re-pop the row every `loopMs` after the arrival has landed. */
  loop: boolean;
  /** The full cycle: one pop plus the quiet time before the next. */
  loopMs: number;
  dotPx: number;
  /** Bump to replay the arrival without remounting anything. Unused by the
   *  animation itself — it just changes the config, and a config change is what
   *  rebuilds it. */
  nonce?: number;
}

/** .itemMain's gap. Cancelling it is what lets the push start from a true zero. */
const ROW_GAP_PX = 6;

/**
 * The dot's departure — the arrival run backwards, and quicker.
 *
 * Arriving is an announcement and takes its time; leaving is an acknowledgement,
 * and holding the row still for another 700ms after the user has answered reads
 * as lag. There is no overshoot on the way out for the same reason: a spring
 * draws the eye, and by now the eye should be on the conversation.
 */
const EXIT_MS = 200;
const EXIT_EASING = 'cubic-bezier(0.4, 0, 1, 1)';

/** The CSS media query can't gate a scripted animation, so check it here. */
const reducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export interface NavListItemProps {
  /**
   * 20px leading slot — icon or avatar, left-aligned within it. Omit for chat
   * rows, where the label runs flush to the 24px panel inset.
   */
  leading?: React.ReactNode;
  label: string;
  active?: boolean;
  /** Render the leading glyph in secondary content colour while expanded. */
  secondaryLeading?: boolean;
  /** Overflow menu contents. Omit entirely for rows without a menu. */
  menuOptions?: RowMenuOption[];
  /** Something in this conversation is waiting on the user — a clarifying
   *  question, say. Shows a dot beside the label. */
  needsAttention?: boolean;
  /** Drives the dot's motion from script instead of the CSS defaults. */
  attentionMotion?: AttentionMotion;
  onClick?: () => void;
}

/**
 * 40px row used for every entry in the panel — new chat, analysts, and chats.
 *
 * The row is a `div` wrapping a full-width button rather than being a button
 * itself, so the overflow trigger can be a real `<button>` sibling. Nesting one
 * button inside another is invalid and browsers recover from it unpredictably.
 */
export const NavListItem: React.FC<NavListItemProps> = ({
  leading,
  label,
  active = false,
  secondaryLeading = false,
  menuOptions,
  needsAttention = false,
  attentionMotion,
  onClick,
}) => {
  const slotRef = useRef<HTMLSpanElement>(null);

  /**
   * Whether the slot is in the tree, which is not the same as whether the row
   * still needs attention: on the way out it stays mounted until it has collapsed
   * to nothing. Unmounting on the prop change alone snapped the label back the
   * full slot width in one frame — the arrival's mirror image, minus the motion.
   */
  const [slotMounted, setSlotMounted] = useState(needsAttention);
  const wasFlagged = useRef(needsAttention);

  useEffect(() => {
    if (needsAttention === wasFlagged.current) return;
    wasFlagged.current = needsAttention;

    if (needsAttention) {
      setSlotMounted(true);
      return;
    }

    const slot = slotRef.current;
    if (!slot || reducedMotion()) {
      setSlotMounted(false);
      return;
    }

    // The loop is mid-cycle and owns `width`; hand over rather than layering.
    slot.getAnimations().forEach((a) => a.cancel());
    // From wherever it actually is, not from the configured resting width — the
    // pop could be at its peak when the answer lands.
    const from = `${slot.getBoundingClientRect().width}px`;
    const exit = slot.animate(
      [
        { width: from, marginRight: '0px', opacity: 1 },
        { width: '0px', marginRight: `${-ROW_GAP_PX}px`, opacity: 0 },
      ],
      { duration: EXIT_MS, easing: EXIT_EASING, fill: 'both' },
    );
    exit.finished
      .then(() => setSlotMounted(false))
      .catch(() => {
        /* re-flagged mid-exit — the next run owns it */
      });
  }, [needsAttention]);

  // Rebuilt whenever the tuning changes, which replays it — that's the point of a
  // control rig. The key is the config's values, not its identity.
  const motionKey = attentionMotion ? JSON.stringify(attentionMotion) : '';
  //
  // `slotMounted` is a dependency, not just a guard: it is state, so the slot is
  // not in the tree yet on the commit where `needsAttention` flips. Without it
  // this effect ran once against a null ref and never again, and the dot appeared
  // at its resting width with no arrival at all.
  useEffect(() => {
    if (!needsAttention || !slotMounted || !attentionMotion) return;
    const m = attentionMotion;
    const slot = slotRef.current;
    if (!slot) return;

    slot.getAnimations().forEach((a) => a.cancel());

    // Two phases with their own durations, so the offset of the overshoot is a
    // consequence of the timings rather than a percentage to reason about.
    const total = Math.max(1, m.outMs + m.settleMs);
    // The resting width, so the row is right even with the arrival turned off and
    // so a cancelled animation reverts to the configured value rather than the
    // stylesheet's.
    slot.style.width = `${m.restPx}px`;

    let stopped = false;

    // The repeat: the same overshoot, but starting from rest rather than from
    // nothing — the dot stays put and the row pops.
    //
    // The pop sits at the END of the cycle, not the start. With it at the start the
    // first repeat fired the instant the arrival landed, so the row popped twice
    // back to back before settling into the interval. Putting the quiet time first
    // means the arrival is followed by a full interval of stillness, and every pop
    // after that is one cycle apart.
    const startLoop = () => {
      if (stopped || !m.loop) return;
      const cycle = Math.max(total + 200, m.loopMs);
      const popStarts = (cycle - total) / cycle;
      const popPeaks = (cycle - total + m.outMs) / cycle;
      slot.animate(
        [
          { offset: 0, width: `${m.restPx}px`, easing: 'linear' },
          { offset: popStarts, width: `${m.restPx}px`, easing: m.outEase },
          { offset: popPeaks, width: `${m.overshootPx}px`, easing: m.settleEase },
          { offset: 1, width: `${m.restPx}px` },
        ],
        { duration: cycle, iterations: Infinity },
      );
    };

    if (m.arrival) {
      const arrival = slot.animate(
        [
          { width: '0px', marginRight: `${-ROW_GAP_PX}px`, easing: m.outEase },
          {
            offset: Math.min(0.999, Math.max(0.001, m.outMs / total)),
            width: `${m.overshootPx}px`,
            marginRight: '0px',
            easing: m.settleEase,
          },
          { width: `${m.restPx}px`, marginRight: '0px' },
        ],
        { duration: total, fill: 'both' },
      );
      // Hand over rather than layering: two animations on one property would have
      // the later one silently win.
      arrival.finished
        .then(() => {
          if (stopped) return;
          arrival.cancel();
          startLoop();
        })
        .catch(() => {
          /* cancelled by a config change — the next effect run owns it */
        });
    } else {
      startLoop();
    }

    return () => {
      stopped = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsAttention, slotMounted, motionKey]);

  const classes = [styles.item, active ? styles.itemActive : ''].filter(Boolean).join(' ');
  const leadingClasses = [
    styles.itemLeading,
    secondaryLeading && !active ? styles.itemLeadingSecondary : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <button type="button" className={styles.itemMain} onClick={onClick} title={label}>
        {/* The dot takes the leading slot, so the label lines up with the rows that
            have glyphs. Rows that already have a glyph keep it — only chat rows,
            which have no leading content, are ever flagged. */}
        {slotMounted && !leading ? (
          <span
            ref={slotRef}
            className={`${styles.itemLeading} ${styles.itemAttention}${
              attentionMotion ? ` ${styles.itemAttentionScripted}` : ''
            }`}
            role="img"
            aria-label="Needs your attention"
          >
            <span
              className={styles.itemAttentionDot}
              style={
                attentionMotion
                  ? { width: attentionMotion.dotPx, height: attentionMotion.dotPx }
                  : undefined
              }
            />
          </span>
        ) : leading ? (
          <span className={leadingClasses}>{leading}</span>
        ) : null}
        <span className={styles.itemLabel}>{label}</span>
      </button>
      {/* No placeholder when absent — the 32px right inset is the resting
          boundary, and the control claims its own width on hover. */}
      {menuOptions?.length ? <RowMenu rowLabel={label} options={menuOptions} /> : null}
    </div>
  );
};

export default NavListItem;
