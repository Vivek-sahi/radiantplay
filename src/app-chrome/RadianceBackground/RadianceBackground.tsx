import React, { useEffect, useRef, useState } from 'react';
import { useIsDarkMode } from '../../context/ThemeContext';
import styles from './RadianceBackground.module.css';

/**
 * RadianceBackground - a Radiance surface (ThoughtSpot's AI identity background).
 *
 * App chrome, not a Radiant component. It only renders the markup the vendored
 * Radiance renderer and product recipes expect (public/vendor/radiance/, managed
 * by npm run radiance:update) and loads them on first use, so pages without
 * Radiance never pay for them. Import it from a prototype with
 * '@/app-chrome/RadianceBackground/RadianceBackground'.
 *
 * pattern: a product pattern, used exactly as it ships (Radiance RULES.md §12),
 * or a template name such as 'top-wash-subtle-dynamic-fast' (§1).
 *   home       Home page hero. Parent: position relative, isolation isolate.
 *   signup     Sign in / sign up brand pane. Parent: position relative, overflow hidden.
 *   spotterx   SpotterX. Fixed to the top of the viewport behind the page; the
 *              app's background must be the base or transparent.
 *   liveboard  Liveboard with its Spotter panel. Parent (the workspace below the
 *              top bar): position relative, overflow hidden, isolation isolate.
 *   template   Fills its parent. Parent: position relative, overflow hidden.
 * Content over a signup or template surface needs position relative and z-index 1.
 *
 * Theme: data-radiance-appearance follows the app theme (ThemeSwitch, Ctrl+D).
 * Product patterns lock their own base; a template sits on `base`, the host's
 * own background colour (SURFACE-1), which defaults to background-base.
 */

const VENDOR = `${import.meta.env.BASE_URL}vendor/radiance/`;
// Set by npm run radiance:update (Radiance version + commit): the files aren't hashed, so this busts browser caches.
const VENDOR_VERSION = '2.0.0-fe8c0cd';

export type RadianceProduct = 'home' | 'signup' | 'spotterx' | 'liveboard';
type Placement = 'right-wash' | 'left-wash' | 'neutral' | 'top-wash' | 'bottom-wash';
/** `<placement>-<intensity>-<motion>-<speed>`, e.g. 'top-wash-subtle-dynamic-fast'. */
export type RadianceTemplate = `${Placement}-${string}`;
export type RadianceState = 'idle' | 'reasoning' | 'answered';

// Products that carry part of their pattern on the page (PRODUCT-3). signup has none.
const PRODUCT_RECIPES: Partial<Record<RadianceProduct, string>> = {
  home: 'radiance-home.css',
  spotterx: 'radiance-spotterx.css',
  liveboard: 'radiance-liveboard.css',
};

const loaded = new Set<string>();

const load = (file: string): void => {
  if (loaded.has(file) || typeof document === 'undefined') return;
  loaded.add(file);
  const href = `${VENDOR}${file}?v=${VENDOR_VERSION}`;
  if (file.endsWith('.css')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  } else {
    const script = document.createElement('script');
    script.src = href;
    document.head.appendChild(script);
  }
};

declare global {
  interface Window {
    RadianceLanguageRenderer?: { refresh(): void };
  }
}

interface RadianceBackgroundProps {
  /** A product pattern or a template name. Default 'home'. */
  pattern?: RadianceProduct | RadianceTemplate;
  /** spotterx and liveboard only: set from the conversation (PRODUCT-4). See useRadianceState. */
  state?: RadianceState;
  /** home only: height of the hero area the wash covers, in px. The fade runs past it. */
  heroHeight?: number;
  /** Templates only: the host's own opaque background colour. Default var(--rd-sys-color-background-base). */
  base?: string;
}

export const RadianceBackground: React.FC<RadianceBackgroundProps> = ({
  pattern = 'home',
  state = 'idle',
  heroHeight = 320,
  base = 'var(--rd-sys-color-background-base)',
}) => {
  const isDark = useIsDarkMode();
  const appearance = isDark ? 'dark' : 'light';
  const recipe = PRODUCT_RECIPES[pattern as RadianceProduct];

  useEffect(() => {
    if (recipe) load(recipe);
    load('radiance-renderer.js');
    window.RadianceLanguageRenderer?.refresh();
  }, [recipe]);

  if (pattern === 'home') {
    return (
      <div
        className={styles.root}
        style={{ '--radiance-hero-height': `${heroHeight}px` } as React.CSSProperties}
        aria-hidden="true"
      >
        <div className={`radiance-home-stage ${styles.stage}`}>
          <div className="radiance-home">
            <div className="radiance-local" data-radiance-pattern="home" data-radiance-appearance={appearance} />
          </div>
        </div>
      </div>
    );
  }

  if (pattern === 'spotterx' || pattern === 'liveboard') {
    return (
      <div className={`radiance-${pattern}`} aria-hidden="true">
        <div
          className="radiance-local"
          data-radiance-pattern={pattern}
          data-radiance-state={state}
          data-radiance-appearance={appearance}
        />
      </div>
    );
  }

  return (
    <div
      className={`radiance-local ${styles.fill}`}
      aria-hidden="true"
      data-radiance-pattern={pattern}
      data-radiance-appearance={appearance}
      style={pattern === 'signup' ? undefined : ({ '--radiance-base': base } as React.CSSProperties)}
    />
  );
};

/** The field settles 530ms after the answer lands (Radiance products/spotterx). */
const RADIANCE_SETTLE_MS = 530;

/**
 * The spotterx / liveboard state through one conversation, as Radiance's own
 * React reference derives it: idle until the first question (and for every new
 * conversation), reasoning while Spotter answers the first question, answered
 * 530ms after that answer lands, for the rest of the conversation.
 *
 * conversationId changes when a new conversation starts; responding is true
 * from send until the answer is on screen.
 */
export function useRadianceState(conversationId: string | number, responding: boolean): RadianceState {
  const [state, setState] = useState<RadianceState>('idle');
  const answered = useRef(false);
  const wasResponding = useRef(false);
  const settle = useRef(0);

  useEffect(() => {
    answered.current = false;
    wasResponding.current = false;
    setState('idle');
    return () => window.clearTimeout(settle.current);
  }, [conversationId]);

  useEffect(() => {
    const landed = wasResponding.current && !responding;
    wasResponding.current = responding;
    if (answered.current) return;
    if (responding) {
      setState('reasoning');
    } else if (landed) {
      answered.current = true;
      settle.current = window.setTimeout(() => setState('answered'), RADIANCE_SETTLE_MS);
    }
  }, [responding]);

  return state;
}
