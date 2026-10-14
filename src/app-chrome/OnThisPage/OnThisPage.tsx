import React, { useEffect, useLayoutEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './OnThisPage.module.css';

/**
 * "On this page" for the design system pages. It reads the page's own section headings (h2 when there are
 * two or more, else h3 when there are three to twelve), gives them one shared style, appears once the reader scrolls, and sits in the
 * space the layout keeps to the right of the content (onChange tells it when a page has a list).
 */
interface Heading { id: string; label: string; el: HTMLElement }

const ROOM = 200; // least room beside the content before the list shows
const SHOW_AFTER = 240; // px scrolled before it appears

const slug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';

// Give the section headings the shared style. Runs before the browser paints (layout effect and
// MutationObserver callbacks), so a heading never shows its page's own style first and then jumps.
function styleHeadings(root: HTMLElement): HTMLElement[] {
  const pick = (sel: string) => [...root.querySelectorAll<HTMLElement>(sel)].filter((h) => !h.closest('[data-demo], [data-no-toc]') && h.textContent?.trim());
  const h2 = pick('h2');
  const h3 = pick('h3');
  // Section headings: h2 when a page has two or more, else h3 when it has three to twelve. They all get the
  // shared section style; the list itself needs three.
  const list = h2.length >= 2 ? h2 : h3.length >= 3 && h3.length <= 12 ? h3 : [];
  root.querySelectorAll(`.${styles.sectionHeading}`).forEach((el) => el.classList.remove(styles.sectionHeading));
  list.forEach((el) => el.classList.add(styles.sectionHeading));
  return list;
}

function collect(root: HTMLElement): Heading[] {
  const list = styleHeadings(root);
  const used = new Set<string>();
  return list.map((el) => {
    const label = el.textContent!.trim();
    let id = el.id || slug(label);
    while (used.has(id)) id += '-2';
    used.add(id);
    if (!el.id) el.id = id;
    el.classList.add(styles.target);
    return { id, label, el };
  });
}

/** Class for the layout's content frame: centred, with room on both sides for the list on wide windows */
export const onThisPageFrame = styles.frame;

export const OnThisPage: React.FC<{
  contentRef: React.RefObject<HTMLElement | null>;
  /** The element that scrolls the page, when it isn't the window (a layout's content panel) */
  scrollRef?: React.RefObject<HTMLElement | null>;
  /** Called with true when the page has a list, so the layout can keep room for it */
  onChange?: (hasList: boolean) => void;
}> = ({ contentRef, scrollRef, onChange }) => {
  const { pathname } = useLocation();
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  // Read the headings after each page renders (pages can render late, so watch for changes briefly).
  // Styling happens at once, before paint; building the list waits for the page to settle.
  useLayoutEffect(() => {
    const root = contentRef.current;
    if (!root) return;
    styleHeadings(root);
    let timer = 0;
    const read = () => setHeadings(collect(root));
    timer = window.setTimeout(read, 150);
    const mo = new MutationObserver(() => { styleHeadings(root); window.clearTimeout(timer); timer = window.setTimeout(read, 250); });
    mo.observe(root, { childList: true, subtree: true });
    const stop = window.setTimeout(() => mo.disconnect(), 3000);
    return () => { mo.disconnect(); window.clearTimeout(timer); window.clearTimeout(stop); };
  }, [contentRef, pathname]);

  const hasList = headings.length >= 3;
  useEffect(() => { onChange?.(hasList); }, [hasList, onChange]);

  // Place it beside the content when there is room, and show it once the reader scrolls.
  useEffect(() => {
    const scroller: HTMLElement | Window = scrollRef?.current ?? window;
    const scrollTop = () => (scroller instanceof Window ? scroller.scrollY : scroller.scrollTop);
    const place = () => {
      const root = contentRef.current;
      if (!root) return;
      const right = root.getBoundingClientRect().right;
      setLeft(window.innerWidth - right >= ROOM ? right : null);
      setScrolled(scrollTop() > SHOW_AFTER);
    };
    place();
    window.addEventListener('resize', place);
    scroller.addEventListener('scroll', place, { passive: true });
    return () => { window.removeEventListener('resize', place); scroller.removeEventListener('scroll', place); };
  }, [contentRef, scrollRef, pathname]);

  // Highlight the section being read: the last heading above the upper third of the window.
  useEffect(() => {
    if (!headings.length) return;
    const update = () => {
      const line = window.innerHeight * 0.33;
      let current = headings[0].id;
      for (const h of headings) if (h.el.getBoundingClientRect().top <= line) current = h.id;
      setActive(current);
    };
    update();
    const scroller: HTMLElement | Window = scrollRef?.current ?? window;
    scroller.addEventListener('scroll', update, { passive: true });
    return () => scroller.removeEventListener('scroll', update);
  }, [headings, scrollRef]);

  if (!hasList || left === null) return null;
  const shown = scrolled;
  return (
    <aside className={`${styles.rail} ${shown ? styles.shown : ''}`} style={{ left }} aria-label="On this page" aria-hidden={!shown}>
      <p className={styles.title}>On this page</p>
      {headings.map((h) => (
        <a
          key={h.id}
          href={`#${h.id}`}
          tabIndex={shown ? 0 : -1}
          className={active === h.id ? styles.active : undefined}
          onClick={(e) => { e.preventDefault(); h.el.scrollIntoView({ behavior: 'smooth', block: 'start' }); history.replaceState(null, '', `#${h.id}`); }}
        >
          {h.label}
        </a>
      ))}
    </aside>
  );
};

/** Section links at the top of a long design system page. The layout's On this page list takes over on scroll. */
export const SectionLinks: React.FC<{ links: { id: string; label: string }[] }> = ({ links }) => (
  <nav className={styles.links} aria-label="Sections">
    {links.map((l) => <a key={l.id} href={`#${l.id}`}>{l.label}</a>)}
  </nav>
);

export default OnThisPage;
