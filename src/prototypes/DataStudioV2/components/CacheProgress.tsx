import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { c, fs, ff } from '../styles';

/**
 * Caching progress — an app-level job, not a page-level one.
 *
 * Caching several tables takes real time (minutes at real scale), and the run-of-show is
 * explicit that waiting it out on stage is dead air: "Cut away and return on the
 * notification — that is the behaviour." So progress lives in the global header, the way a
 * Drive upload does, and survives navigating away from the canvas that started it.
 *
 * That is why this is a context rather than state in ModelCanvas: the header is rendered in
 * two places (Shell for every view, ModelCanvas for the canvas view, which hides Shell's),
 * and the job has to outlive whichever one is mounted.
 *
 * The chip is deliberately not a toast. A toast disappears, and the point of this beat is
 * that you can leave, do something else, and still be able to get back.
 */

export interface CacheJob {
  /** Tables being cached, in the order they complete. */
  tables: string[];
  /** How many have finished. */
  done: number;
  status: 'running' | 'done';
}

interface CacheContextValue {
  job: CacheJob | null;
  /** Start (or restart) a caching run. `perTableMs` paces one table's completion. */
  startCaching: (tables: string[], opts?: { perTableMs?: number; onDone?: () => void }) => void;
  dismiss: () => void;
}

const CacheContext = createContext<CacheContextValue>({
  job: null,
  startCaching: () => {},
  dismiss: () => {},
});

export const CacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [job, setJob] = useState<CacheJob | null>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = () => { timers.current.forEach(t => window.clearTimeout(t)); timers.current = []; };
  useEffect(() => clearTimers, []);

  const startCaching = useCallback((tables: string[], opts?: { perTableMs?: number; onDone?: () => void }) => {
    if (!tables.length) return;
    clearTimers();
    const per = opts?.perTableMs ?? 1600;
    setJob({ tables, done: 0, status: 'running' });
    tables.forEach((_, i) => {
      const t = window.setTimeout(() => {
        const isLast = i === tables.length - 1;
        setJob({ tables, done: i + 1, status: isLast ? 'done' : 'running' });
        if (isLast) opts?.onDone?.();
      }, per * (i + 1));
      timers.current.push(t);
    });
  }, []);

  const dismiss = useCallback(() => { clearTimers(); setJob(null); }, []);

  return (
    <CacheContext.Provider value={{ job, startCaching, dismiss }}>
      {children}
    </CacheContext.Provider>
  );
};

export const useCache = (): CacheContextValue => useContext(CacheContext);

/**
 * The header chip. Renders nothing when no job exists, so both header sites can mount it
 * unconditionally.
 *
 * `onView` is what makes leaving safe — it returns you to the canvas. It's omitted on the
 * canvas itself, where there is nowhere to go.
 */
/** Progress-ring geometry — r and its circumference, so the arc maths reads plainly. */
const RING_R = 6.4;
const RING_C = 2 * Math.PI * RING_R;

export const CacheProgressChip: React.FC<{ onView?: () => void }> = ({ onView }) => {
  const { job } = useCache();
  if (!job) return null;

  const running = job.status === 'running';
  const total = job.tables.length;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        // Roomier on the right than the 4px it had: the trailing icon button was sitting
        // hard against the border, and with no icon the label ran into the edge.
        height: 30, padding: onView ? '0 8px 0 12px' : '0 14px', marginRight: 4,
        borderRadius: 15,
        border: `1px solid ${running ? '#E2E6EC' : '#B7E8D3'}`,
        background: running ? '#fff' : '#F1FBF6',
        fontFamily: ff.primary, flexShrink: 0, whiteSpace: 'nowrap',
      }}
    >
      {/* The circle carries the progress on its own — it fills as tables complete, so a
          separate bar was saying the same thing twice. Not a spinner: a ring that both
          spins and fills reads as two unrelated signals. */}
      {running ? (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden style={{ flexShrink: 0, transform: 'rotate(-90deg)' }}>
          <circle cx="8" cy="8" r={RING_R} stroke="#E2E6EC" strokeWidth="2" />
          <circle
            cx="8" cy="8" r={RING_R} stroke="#2770EF" strokeWidth="2" strokeLinecap="round"
            strokeDasharray={RING_C}
            strokeDashoffset={RING_C * (1 - job.done / total)}
            style={{ transition: 'stroke-dashoffset 320ms cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden style={{ flexShrink: 0 }}>
          <circle cx="8" cy="8" r="7" fill="#06BF7F" />
          <path d="M4.8 8.2l2.1 2.1 4.3-4.4" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}

      <span style={{ fontSize: fs.sm, fontWeight: 500, color: c['content-primary'] }}>
        {running
          ? `Caching · ${job.done} of ${total} tables`
          : `${total} tables cached`}
      </span>

      {/* Open the model again. This replaces the dismiss: the chip's job is to be the way
          back to what's being cached, so closing it was removing the only route. */}
      {onView && (
        <button
          onClick={onView}
          aria-label="Open the model"
          title="Open the model"
          style={{
            width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 6, border: 'none', background: 'transparent',
            color: c['content-secondary'], cursor: 'pointer', flexShrink: 0,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#EAEDF2'; (e.currentTarget as HTMLElement).style.color = c['content-brand']; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = c['content-secondary']; }}
        >
          {/* Arrow leaving a frame — "take me to it", not "open a new tab". */}
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.5 2.5H13v3.5" />
            <path d="M13 2.5L7.5 8" />
            <path d="M12 9.5V12a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 12V5.5A1.5 1.5 0 0 1 4 4h2.5" />
          </svg>
        </button>
      )}
    </div>
  );
};
