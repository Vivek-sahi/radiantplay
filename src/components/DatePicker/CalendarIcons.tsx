import React from 'react';
import styles from './DatePicker.module.css';

/**
 * Calendar icon
 */
export const CalendarIcon: React.FC = () => (
  <svg className={styles.calendarIcon} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M2 6H14" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5 1V4M11 1V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/**
 * Navigation icons
 */
export const ChevronLeftIcon: React.FC = () => (
  <svg className={styles.navIcon} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ChevronRightIcon: React.FC = () => (
  <svg className={styles.navIcon} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
