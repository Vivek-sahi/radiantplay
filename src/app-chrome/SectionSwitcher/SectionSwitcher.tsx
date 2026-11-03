import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SectionSwitcher.module.css';

/**
 * SectionSwitcher - moves between Radiant Play's two sections, the playground and the design system.
 *
 * App chrome, not a Radiant component. Both sections show it in the row above their content panel, so they
 * read as one app. The guides are listed in each section's left pane (see ../guides.ts).
 */

export type RadiantPlaySection = 'playground' | 'design-system';

const SECTIONS: { id: RadiantPlaySection; label: string; path: string }[] = [
  { id: 'playground', label: 'Playground', path: '/playground' },
  { id: 'design-system', label: 'Design system', path: '/radiant' },
];

export const SectionSwitcher: React.FC<{ active: RadiantPlaySection }> = ({ active }) => {
  const navigate = useNavigate();

  return (
    <nav className={styles.switcher} aria-label="Radiant Play sections">
      {SECTIONS.map((section) =>
        section.id === active ? (
          <span key={section.id} className={`${styles.item} ${styles.active}`} aria-current="page">
            {section.label}
          </span>
        ) : (
          <a
            key={section.id}
            href={section.path}
            className={styles.item}
            onClick={(e) => { e.preventDefault(); navigate(section.path); }}
          >
            {section.label}
          </a>
        ),
      )}
    </nav>
  );
};

export default SectionSwitcher;
