import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '../Button';
import styles from './Tour.module.css';

export type TourTone = 'default' | 'brand';

export interface TourStep {
  target: string;
  title?: string;
  content: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export interface TourProps {
  steps: TourStep[];
  isRunning: boolean;
  onFinish?: () => void;
  onSkip?: () => void;
  startIndex?: number;
  /**
   * `default`: raised white card.
   * `brand`: the Figma spotlight card, brand fill with inverse text,
   * a "2 of 4" counter and white tertiary buttons.
   * @default 'default'
   */
  tone?: TourTone;
}

interface PopoverPosition {
  top: number;
  left: number;
}

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function getPopoverPosition(
  targetRect: DOMRect,
  placement: TourStep['placement'] = 'bottom',
  popoverWidth: number,
  popoverHeight: number
): PopoverPosition {
  const OFFSET = 12;

  switch (placement) {
    case 'top':
      return {
        top: targetRect.top + window.scrollY - popoverHeight - OFFSET,
        left: targetRect.left + window.scrollX + targetRect.width / 2 - popoverWidth / 2,
      };
    case 'left':
      return {
        top: targetRect.top + window.scrollY + targetRect.height / 2 - popoverHeight / 2,
        left: targetRect.left + window.scrollX - popoverWidth - OFFSET,
      };
    case 'right':
      return {
        top: targetRect.top + window.scrollY + targetRect.height / 2 - popoverHeight / 2,
        left: targetRect.right + window.scrollX + OFFSET,
      };
    case 'bottom':
    default:
      return {
        top: targetRect.bottom + window.scrollY + OFFSET,
        left: targetRect.left + window.scrollX + targetRect.width / 2 - popoverWidth / 2,
      };
  }
}

export const Tour: React.FC<TourProps> = ({
  steps,
  isRunning,
  onFinish,
  onSkip,
  startIndex = 0,
  tone = 'default',
}) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [popoverPos, setPopoverPos] = useState<PopoverPosition>({ top: 0, left: 0 });
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const currentStep = steps[currentIndex];

  const recalculate = useCallback(() => {
    if (!isRunning || !currentStep) return;

    const target = document.querySelector(currentStep.target);
    if (!target) return;

    const targetRect = target.getBoundingClientRect();
    const popoverWidth = popoverRef.current?.offsetWidth ?? 320;
    const popoverHeight = popoverRef.current?.offsetHeight ?? 160;

    const pos = getPopoverPosition(
      targetRect,
      currentStep.placement ?? 'bottom',
      popoverWidth,
      popoverHeight
    );

    // Clamp to viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    pos.left = Math.max(8, Math.min(pos.left, viewportWidth - popoverWidth - 8));
    pos.top = Math.max(8, Math.min(pos.top, viewportHeight + window.scrollY - popoverHeight - 8));

    setPopoverPos(pos);
    setSpotlightRect({
      top: targetRect.top + window.scrollY,
      left: targetRect.left + window.scrollX,
      width: targetRect.width,
      height: targetRect.height,
    });
  }, [isRunning, currentStep]);

  useEffect(() => {
    recalculate();
  }, [recalculate, currentIndex]);

  useEffect(() => {
    if (!isRunning) return;
    window.addEventListener('resize', recalculate);
    window.addEventListener('scroll', recalculate);
    return () => {
      window.removeEventListener('resize', recalculate);
      window.removeEventListener('scroll', recalculate);
    };
  }, [isRunning, recalculate]);

  // Reset to startIndex when tour starts
  useEffect(() => {
    if (isRunning) {
      setCurrentIndex(startIndex);
    }
  }, [isRunning, startIndex]);

  if (!isRunning || !currentStep) return null;

  const isLast = currentIndex === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      onFinish?.();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handleSkip = () => {
    onSkip?.();
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div className={styles.backdrop} aria-hidden="true" />

      {/* Spotlight cutout */}
      {spotlightRect && (
        <div
          className={styles.spotlight}
          style={{
            top: spotlightRect.top - 4,
            left: spotlightRect.left - 4,
            width: spotlightRect.width + 8,
            height: spotlightRect.height + 8,
          }}
          aria-hidden="true"
        />
      )}

      {/* Popover */}
      {tone === 'brand' ? (
        <div
          ref={popoverRef}
          className={`${styles.popover} ${styles.popoverBrand}`}
          style={{ top: popoverPos.top, left: popoverPos.left }}
          role="dialog"
          aria-modal="true"
          aria-label={currentStep.title ?? `Step ${currentIndex + 1} of ${steps.length}`}
        >
          {currentStep.title && (
            <div className={styles.brandTitle}>{currentStep.title}</div>
          )}
          <div className={styles.brandContent}>{currentStep.content}</div>
          <div className={styles.popoverFooter}>
            <span className={styles.brandStepCount}>
              {currentIndex + 1} of {steps.length}
            </span>
            <div className={styles.footerActions}>
              {onSkip && (
                <Button variant="tertiary" colorway="white" size="small" onClick={handleSkip}>
                  Skip
                </Button>
              )}
              <Button variant="tertiary" colorway="white" size="small" onClick={handleNext}>
                {isLast ? 'Finish' : 'Next'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          ref={popoverRef}
          className={styles.popover}
          style={{ top: popoverPos.top, left: popoverPos.left }}
          role="dialog"
          aria-modal="true"
          aria-label={currentStep.title ?? `Step ${currentIndex + 1} of ${steps.length}`}
        >
          {currentStep.title && (
            <div className={styles.popoverTitle}>{currentStep.title}</div>
          )}
          <div className={styles.popoverContent}>{currentStep.content}</div>
          <div className={styles.popoverFooter}>
            <span className={styles.stepCount}>
              Step {currentIndex + 1} of {steps.length}
            </span>
            <div className={styles.footerActions}>
              {onSkip && (
                <button
                  className={styles.skipButton}
                  onClick={handleSkip}
                  type="button"
                >
                  Skip
                </button>
              )}
              <button
                className={styles.nextButton}
                onClick={handleNext}
                type="button"
              >
                {isLast ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Tour;
