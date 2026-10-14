import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentVersion } from '../../data/versionHistory';
import styles from './AppLogo.module.css';

/**
 * AppLogo - the play mark, "Radiant Play" and the version, at the top of the playground's and the design
 * system's left panes. The mark and name go to the home page (/home); the version opens the changelog.
 */
export const AppLogo: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className={styles.logo}>
      <button type="button" className={styles.home} onClick={() => navigate('/home')} aria-label="Radiant Play home">
        <svg className={styles.mark} viewBox="0 0 100 100" aria-hidden="true">
          <path className={styles.markShape} d="M22 14 L22 86 L86 50 Z" strokeWidth="16" strokeLinejoin="round" />
          <text className={styles.markText} x="43" y="52" textAnchor="middle" dominantBaseline="central" fontSize="30" letterSpacing="-2">Rp</text>
        </svg>
        <span className={styles.name}>Radiant Play</span>
      </button>
      <button type="button" className={styles.version} onClick={() => navigate('/radiant/changelog')} title="View changelog">
        {getCurrentVersion()}
      </button>
    </div>
  );
};

export default AppLogo;
