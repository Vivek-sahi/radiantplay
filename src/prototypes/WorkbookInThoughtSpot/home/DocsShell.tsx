import React, { useEffect, useState } from 'react';
import { Typography } from '@/components';
import styles from './DocsShell.module.css';

// The Workbook in ThoughtSpot project home's layout (Vivek, 4 Nov: "a home page for the workbook project which has all
// the links, like how we made for AgentDB"). A copy of the AgentDB MVP docs shell, so the two projects stay
// independent: a short menu on the left, every item a section of the home page.

export const HOME = '/playground/WorkbookInThoughtSpotHome';

export const MENU: { label: string; href: string; section?: string }[] = [
  { label: 'Home', href: HOME },
  { label: 'The need', href: `${HOME}#need`, section: 'need' },
  { label: 'Jobs', href: `${HOME}#jobs`, section: 'jobs' },
  { label: 'Lifecycle', href: `${HOME}#lifecycle`, section: 'lifecycle' },
  { label: 'Key workflows', href: `${HOME}#flows`, section: 'flows' },
  { label: 'Information architecture', href: `${HOME}#ia`, section: 'ia' },
  { label: 'Design decisions', href: `${HOME}#decisions`, section: 'decisions' },
  { label: 'Change log', href: `${HOME}#changes`, section: 'changes' },
];
const SECTIONS = MENU.flatMap((m) => (m.section ? [m.section] : []));

const scrollTo = (id: string | null) => {
  if (!id) return window.scrollTo({ top: 0, behavior: 'smooth' });
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/** Which section is being read, '' at the top. */
const useReading = (): string => {
  const [reading, setReading] = useState('');
  useEffect(() => {
    const on = () => {
      let cur = '';
      for (const id of SECTIONS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.3) cur = id;
      }
      setReading(cur);
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return reading;
};

export const DocsShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const reading = useReading();
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) window.setTimeout(() => scrollTo(id), 50);
  }, []);
  return (
    <div className={styles.shell}>
      <aside className={styles.panel} aria-label="Workbook in ThoughtSpot">
        <nav className={styles.group}>
          <Typography variant="overline" color="gray-light" noMargin className={styles.groupLabel}>
            Workbook in ThoughtSpot
          </Typography>
          {MENU.map((m) => {
            const on = (m.section ?? '') === reading;
            return (
              <a
                key={m.label}
                href={m.href}
                className={`${styles.item} ${on ? styles.active : ''}`}
                aria-current={on ? 'location' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  window.history.replaceState(null, '', m.href);
                  scrollTo(m.section ?? null);
                }}
              >
                <Typography variant="body-normal" color={on ? 'base' : 'gray-light'} noMargin>
                  {m.label}
                </Typography>
              </a>
            );
          })}
        </nav>
      </aside>
      <main className={styles.content}>
        <div className={styles.inner}>{children}</div>
      </main>
    </div>
  );
};
