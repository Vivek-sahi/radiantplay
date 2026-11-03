import React, { useEffect, useRef } from 'react';
import styles from './LeftPanel.module.css';

export interface CollapsibleProps {
  open: boolean;
  children: React.ReactNode;
}

/**
 * Height-animated disclosure for the nav sections. Reads as a mask — the
 * container clips its rows from the bottom while the content stays put.
 *
 * `height: auto` can't be transitioned, so each change pins an explicit start
 * height, forces a reflow so the browser actually adopts it, then sets the
 * target. Height is driven imperatively rather than through state — going via
 * a render pass lets React commit both values inside one frame, and the browser
 * then only ever paints the target, which skips the transition entirely.
 *
 * Once open and settled, height hands back to `auto` so the section can still
 * grow if its rows change.
 */
export const Collapsible: React.FC<CollapsibleProps> = ({ open, children }) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  // Captured once — React must not re-apply the style prop on later renders,
  // or it would clobber the imperative writes below.
  const initiallyOpen = useRef(open).current;

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    // The initial state renders settled; only later changes animate.
    if (!mounted.current) {
      mounted.current = true;
      return;
    }

    const measured = inner.scrollHeight;

    outer.style.height = open ? '0px' : `${measured}px`;
    void outer.offsetHeight; // flush, so there is a real value to animate from
    outer.style.height = open ? `${measured}px` : '0px';
  }, [open]);

  return (
    <div
      ref={outerRef}
      className={styles.collapsible}
      style={initiallyOpen ? undefined : { height: 0 }}
      onTransitionEnd={(event) => {
        if (event.propertyName === 'height' && open && outerRef.current) {
          outerRef.current.style.height = 'auto';
        }
      }}
    >
      <div ref={innerRef} className={styles.collapsibleInner}>
        {children}
      </div>
    </div>
  );
};

export default Collapsible;
