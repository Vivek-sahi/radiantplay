import React, { useEffect, useRef, useState } from 'react';
import { useIsDarkMode } from '../context/ThemeContext';
import { sysVar } from '../tokens/colors';

/**
 * Live preview for a gallery card that has no thumbnail: the prototype itself,
 * rendered in a scaled-down iframe. Only cards on screen load one, at most
 * MAX_LOADING at a time, and an iframe is removed again when its card scrolls
 * away, so a long gallery stays light. Capture a real thumbnail with
 * `npm run thumbnails -- <Name>` to replace it.
 */

const FRAME_WIDTH = 1280;
const FRAME_HEIGHT = 720;
const MAX_LOADING = 4;

// Small queue so only a few previews boot at the same time
let loading = 0;
const waiting: Array<() => void> = [];
const acquire = (start: () => void) => {
  if (loading < MAX_LOADING) { loading++; start(); } else waiting.push(start);
};
const release = () => {
  const next = waiting.shift();
  if (next) next(); else loading = Math.max(0, loading - 1);
};

export const GalleryLivePreview: React.FC<{ id: string; name: string }> = ({ id, name }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [granted, setGranted] = useState(false);
  const [scale, setScale] = useState(0.25);
  const isDark = useIsDarkMode();
  const holding = useRef(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '200px' });
    const ro = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / FRAME_WIDTH));
    io.observe(el);
    ro.observe(el);
    return () => { io.disconnect(); ro.disconnect(); };
  }, []);

  // Ask for a loading slot when the card comes into view; drop the iframe when it leaves
  useEffect(() => {
    if (!visible) { setGranted(false); return; }
    let cancelled = false;
    acquire(() => {
      if (cancelled) { release(); return; }
      holding.current = true;
      setGranted(true);
    });
    return () => {
      cancelled = true;
      if (holding.current) { holding.current = false; release(); }
    };
  }, [visible]);

  const handleLoad = () => {
    if (holding.current) { holding.current = false; release(); }
  };

  return (
    <div ref={wrapRef} style={styles.wrap} aria-label={`${name} live preview`} role="img">
      {granted && (
        <iframe
          // Re-mount on theme change so the preview starts in the current theme
          key={isDark ? 'dark' : 'light'}
          src={`/playground/${id}`}
          title={`${name} preview`}
          tabIndex={-1}
          aria-hidden
          sandbox="allow-scripts allow-same-origin"
          onLoad={handleLoad}
          style={{ ...styles.frame, transform: `scale(${scale})` }}
        />
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    background: sysVar('background-sunken'),
  },
  frame: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    border: 0,
    transformOrigin: '0 0',
    pointerEvents: 'none',
    position: 'absolute',
    top: 0,
    left: 0,
  },
};
