import React, { useEffect, useState } from 'react';
import { Typography } from '@/components';
import styles from './DocsShell.module.css';

export const PROTOTYPE = '/playground/AgentDBMVP';
export const HOME = '/playground/AgentDBMVPHome';
export const REPO = 'https://github.com/Vivek-sahi/radiantplay/tree/prototype/data-studio/src/prototypes/AgentDBMVP';

export interface NavItem {
  label: string;
  href: string;
  /** Leaves this page: another page, the prototype, or a new tab. Shows an arrow. */
  out?: boolean;
  newTab?: boolean;
}
export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** The whole menu (Vivek, 19 Oct). Every item is a section of the home page and scrolls to it. */
const MENU: { label: string; href: string; section?: string }[] = [
  { label: 'Home', href: HOME },
  { label: 'Architecture', href: `${HOME}#architecture`, section: 'architecture' },
  { label: 'Information architecture', href: `${HOME}#ia`, section: 'ia' },
  { label: 'Key flows', href: `${HOME}#flows`, section: 'flows' },
  { label: 'Demo script', href: `${HOME}#demo`, section: 'demo' },
  { label: 'Design decisions', href: `${HOME}#decisions`, section: 'decisions' },
  { label: 'Change log', href: `${HOME}#changes`, section: 'changes' },
];
const SECTIONS = MENU.flatMap((m) => (m.section ? [m.section] : []));

const scrollTo = (id: string | null) => {
  if (!id) return window.scrollTo({ top: 0, behavior: 'smooth' });
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/** On the home page: which section is being read, '' at the top. Elsewhere: nothing. */
const useReading = (onHome: boolean): string => {
  const [reading, setReading] = useState('');
  useEffect(() => {
    if (!onHome) return;
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
  }, [onHome]);
  return reading;
};

/** The AgentDB MVP docs layout: a short menu on the left, content on the right. */
export const DocsShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const path = window.location.pathname;
  const onHome = path === HOME;
  const reading = useReading(onHome);

  // Arriving from another page with a section in the address: scroll to it once it has rendered.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (onHome && id) window.setTimeout(() => scrollTo(id), 50);
  }, [onHome]);

  const isOn = (m: (typeof MENU)[number]) => (onHome ? (m.section ?? '') === reading && m.href.startsWith(HOME) : m.href === path);

  return (
    <div className={styles.shell}>
      <aside className={styles.panel} aria-label="AgentDB MVP">
        <nav className={styles.group}>
          <Typography variant="overline" color="gray-light" noMargin className={styles.groupLabel}>
            AgentDB MVP
          </Typography>
          {MENU.map((m) => {
            const on = isOn(m);
            return (
              <a
                key={m.label}
                href={m.href}
                className={`${styles.item} ${on ? styles.active : ''}`}
                aria-current={on ? 'location' : undefined}
                onClick={(e) => {
                  if (!onHome || !m.href.startsWith(HOME)) return;
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
