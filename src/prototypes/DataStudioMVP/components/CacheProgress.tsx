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
 * It stays in the header rather than moving to a bottom-right toast: a persistent top
 * indicator is the convention for "something is running" exactly because it's always in
 * view, which is what makes leaving the canvas safe.
 *
 * It is closeable, though. It was briefly not, on the reasoning that the chip was the only
 * route back to the model — but that got the dependency backwards. The way back to a model
 * is the model, via Models or Recent; making a progress notification carry navigation is
 * what forced it to be permanent, and permanent is what made it read as stuck.
 */

export interface CacheJob {
  /** Tables being cached, in the order they complete. */
  tables: string[];
  /** How many have finished. */
  done: number;
  status: 'running' | 'done';
  /** When the run began, so progress can be interpolated between completions. */
  startedAt: number;
  /** How long one table takes, same purpose. */
  perTableMs: number;
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
    const startedAt = Date.now();
    setJob({ tables, done: 0, status: 'running', startedAt, perTableMs: per });
    tables.forEach((_, i) => {
      const t = window.setTimeout(() => {
        const isLast = i === tables.length - 1;
        setJob({ tables, done: i + 1, status: isLast ? 'done' : 'running', startedAt, perTableMs: per });
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
 * `onView` takes you to the model being cached, and is passed only where that goes
 * somewhere — i.e. not on the canvas itself. It reads as the word "View" rather than an
 * arrow-leaving-a-frame glyph, which said "open in a new tab" and, on a screen you hadn't
 * left, said nothing at all.
 */
/** Progress-ring geometry — r and its circumference, so the arc maths reads plainly. */
const RING_R = 6.4;
const RING_C = 2 * Math.PI * RING_R;

/**
 * The caching ring, animated against the clock rather than against completions.
 *
 * ⚠️ **This exists because a ring driven by `done` is motionless most of the time.** A run is
 * 30 seconds over five tables, so the arc advanced once every six seconds and sat perfectly
 * still in between — which reads as a stalled job, not a running one, and is the one thing a
 * progress indicator must never say. It now grows continuously from elapsed time, and the
 * counter underneath still steps per table, so the smooth part and the countable part agree
 * without either having to fake the other.
 *
 * It is a component of its own, not a few lines inside the pill, so that the 120ms tick
 * re-renders ~50 nodes rather than the whole 9,000-line canvas.
 *
 * Interpolation is honest here because the prototype's timing is *chosen* (`CACHE_RUN_TOTAL_MS`)
 * rather than measured — the elapsed fraction is exactly as true as the completions are. Against
 * a real backend this would have to come from the server's own progress, not a local clock.
 */
export const CacheProgressRing: React.FC<{
  size?: number;
  /** Track and arc colours, so the ring can sit on the topbar pill or in the header chip. */
  track?: string;
  arc?: string;
}> = ({ size = 14, track = '#D6DBE5', arc = '#2770EF' }) => {
  const { job } = useCache();
  const running = !!job && job.status === 'running';
  const [, tick] = useState(0);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => tick(n => (n + 1) % 1_000_000), 120);
    return () => window.clearInterval(id);
  }, [running]);

  const total = job?.tables.length ?? 0;
  const elapsed = job ? Date.now() - job.startedAt : 0;
  const duration = job ? job.perTableMs * Math.max(1, total) : 1;
  // Capped just under full while running: an arc that closes before the last table lands says
  // the job is finished when it isn't.
  const fraction = !job ? 0
    : job.status === 'done' ? 1
      : Math.min(0.97, Math.max(0, elapsed / duration));

  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden style={{ flexShrink: 0, transform: 'rotate(-90deg)' }}>
      <circle cx="8" cy="8" r={RING_R} stroke={track} strokeWidth="2" />
      <circle
        cx="8" cy="8" r={RING_R} stroke={arc} strokeWidth="2" strokeLinecap="round"
        strokeDasharray={RING_C}
        strokeDashoffset={RING_C * (1 - fraction)}
        /* Just longer than the tick, so each step eases into the next and the arc reads as
           one continuous movement rather than 8 updates a second. */
        style={{ transition: 'stroke-dashoffset 140ms linear' }}
      />
    </svg>
  );
};

export const CacheProgressChip: React.FC<{ onView?: () => void }> = ({ onView }) => {
  const { job, dismiss } = useCache();
  if (!job) return null;

  const running = job.status === 'running';
  const total = job.tables.length;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        // The close button carries its own right-hand breathing room, so the chip's
        // padding is asymmetric: a full 12px on the label side, 5px on the control side.
        height: 30, padding: '0 5px 0 12px', marginRight: 4,
        borderRadius: 15,
        // Neutral in both states. Finishing turned this green — a success colour for a
        // job that was never at risk of failing, which asked to be read as an outcome
        // when it's only a fact. The wording already says it's done.
        border: `1px solid ${c['border-subtle-hover']}`,
        background: '#fff',
        fontFamily: ff.primary, flexShrink: 0, whiteSpace: 'nowrap',
      }}
    >
      {/* The circle carries the progress on its own — it fills as tables complete, so a
          separate bar was saying the same thing twice. Not a spinner: a ring that both
          spins and fills reads as two unrelated signals. */}
      {/* Ring while running, tick when done — both 14px, so the chip doesn't resize at
          the moment it finishes. The tick is ink-coloured, not green: nothing here was
          at risk of failing, so a success colour asks to be read as an outcome when it
          only marks the end of a count. */}
      {running ? (
        <CacheProgressRing size={14} track="#E2E6EC" />
      ) : (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden style={{ flexShrink: 0 }}>
          <path d="M3.2 8.4l3.1 3.1 6.5-6.6" stroke={c['content-primary']} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}

      {/* One sentence throughout, so the chip never rewrites or resizes under you — it
          just counts up and stops. "5 of 5 tables cached" is the finished state. */}
      <span style={{ fontSize: fs.sm, fontWeight: 500, color: c['content-primary'], fontVariantNumeric: 'tabular-nums' }}>
        {`${job.done} of ${total} tables cached`}
      </span>

      {/* Only where it actually goes somewhere — see onView. */}
      {onView && (
        <button
          onClick={onView}
          style={{
            height: 22, padding: '0 8px', display: 'flex', alignItems: 'center',
            borderRadius: 6, border: 'none', background: 'transparent',
            fontFamily: ff.primary, fontSize: fs.xs, fontWeight: 600,
            color: c['content-brand'], cursor: 'pointer', flexShrink: 0,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = c['background-subtle']; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          View
        </button>
      )}

      {/* Always present. A job you can't dismiss stops being a notification and becomes
          furniture — which is what made this read as stuck once the caching had finished. */}
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        title="Dismiss"
        style={{
          width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 5, border: 'none', background: 'transparent',
          color: '#A5ACB9', cursor: 'pointer', flexShrink: 0,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = c['background-subtle']; (e.currentTarget as HTMLElement).style.color = c['content-primary']; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#A5ACB9'; }}
      >
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </button>
    </div>
  );
};
