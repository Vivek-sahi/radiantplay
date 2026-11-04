import React from 'react';
import styles from './CacheMarkIcon.module.css';

/** The cache mark, lit: the database with the bolt in brand blue, a glow that breathes behind it. */
export const CacheMarkIcon: React.FC = () => (
  <svg className={styles.mark} viewBox="0 0 140 140" width="140" height="140" fill="none" aria-hidden="true">
    <circle className={styles.glow} cx="70" cy="66" r="58" />
    <ellipse className={styles.top} cx="70" cy="44" rx="34" ry="11" />
    <path className={styles.mid} d="M36 44v22c0 6 15 11 34 11s34-5 34-11V44c0 6-15 11-34 11S36 50 36 44z" />
    <path className={styles.low} d="M36 66v22c0 6 15 11 34 11s34-5 34-11V66c0 6-15 11-34 11S36 72 36 66z" />
    <path className={styles.bolt} d="M76 56 60 84h12l-4 20 18-30H74l2-18z" />
  </svg>
);
