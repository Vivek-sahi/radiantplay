import React, { useEffect } from 'react';
import { useIsDarkMode } from '../../context/ThemeContext';
import styles from './RadianceBackground.module.css';

/**
 * RadianceBackground - the Radiance "home" product pattern behind a page's top area.
 *
 * App chrome, not a Radiant component. It only renders the markup the vendored
 * Radiance renderer and Home recipe expect (public/vendor/radiance/) and loads
 * them once, on first use, so prototype pages never pay for them.
 *
 * Theme: data-radiance-appearance follows the app theme (ThemeSwitch, Ctrl+D).
 * Base colour: the "home" pattern locks its own base, so none is passed.
 *
 * The parent needs `position: relative` and `isolation: isolate`.
 */

const VENDOR = `${import.meta.env.BASE_URL}vendor/radiance/`;
// Bump with each vendored update: the files aren't hashed, so this busts browser caches.
const VENDOR_VERSION = '2.0.0';
let loaded = false;

const loadRadiance = (): void => {
  if (loaded || typeof document === 'undefined') return;
  loaded = true;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `${VENDOR}radiance-home.css?v=${VENDOR_VERSION}`;
  document.head.appendChild(link);
  const script = document.createElement('script');
  script.src = `${VENDOR}radiance-renderer.js?v=${VENDOR_VERSION}`;
  document.head.appendChild(script);
};

interface RadianceBackgroundProps {
  /** Height of the hero area the wash covers, in px. The fade runs past it. */
  heroHeight?: number;
}

export const RadianceBackground: React.FC<RadianceBackgroundProps> = ({ heroHeight = 320 }) => {
  const isDark = useIsDarkMode();

  useEffect(loadRadiance, []);

  return (
    <div
      className={styles.root}
      style={{ '--radiance-hero-height': `${heroHeight}px` } as React.CSSProperties}
      aria-hidden="true"
    >
      <div className={`radiance-home-stage ${styles.stage}`}>
        <div className="radiance-home">
          <div
            className="radiance-local"
            data-radiance-pattern="home"
            data-radiance-appearance={isDark ? 'dark' : 'light'}
          />
        </div>
      </div>
    </div>
  );
};
