import React from 'react';
import styles from './LedgerAnimation.module.css';

/**
 * The Caching tab's hero as a live ledger (Vivek, 4 Nov): queries scroll up like a
 * tailed log. As each line crosses the band it gets its result stamped: a green
 * cache hit with a few milliseconds, or a grey warehouse run with a couple of
 * seconds. Three of every five are hits. Freezes under prefers-reduced-motion.
 */
const Q: [string, string, string][] = [
  ['select', 'sum(revenue)', 'from orders group by region'], ['select', 'count(*)', 'from sessions where day = today'], ['select', 'top 10 store_id', 'by margin, last 7 days'],
  ['select', 'avg(basket)', 'from orders by channel'], ['select', 'sum(returns)', 'by reason, 30 days'], ['select', 'count(distinct user)', 'by hour, weekdays'],
  ['select', 'sum(spend)', 'vs budget, q4'], ['select', 'churn', 'by signup cohort'], ['select', 'stock', 'where qty < reorder'], ['select', 'pipeline', 'by rep, this quarter'],
  ['select', 'sum(refunds)', 'by reason, 30 days'], ['select', 'sessions', 'by landing page'], ['select', 'sum(units)', 'by sku, yesterday'], ['select', 'nps', 'by store, this month'],
];
const id = (i: number) => 'q_' + ((i * 2654435761) >>> 0).toString(16).slice(0, 5);
const ts = (i: number) => `12:04:${String(10 + (i % 50)).padStart(2, '0')}.${String((i * 137) % 1000).padStart(3, '0')}`;
const hitOf = (i: number) => i % 5 < 3;
const latHit = (i: number) => `${2 + ((i * 7) % 9)}ms`;
const latMiss = (i: number) => `${(1.2 + ((i * 3) % 4) / 2).toFixed(1)}s`;

export const LedgerAnimation: React.FC = () => {
  const rows = Q.concat(Q);
  return (
    <div className={styles.frame} role="img" aria-label="A log of queries; most are answered by the cache in milliseconds, a few run in the warehouse">
      <div className={styles.band} aria-hidden="true" />
      <div className={styles.log} aria-hidden="true">
        {rows.map((q, i) => {
          const hit = hitOf(i);
          return (
            <div key={i} className={styles.row}>
              <span className={styles.ts}>{ts(i)}</span>
              <span className={styles.id}>{id(i)}</span>
              <span>
                <span className={styles.kw}>{q[0]}</span> <span className={styles.fn}>{q[1]}</span> <span className={styles.str}>{q[2]}</span>
              </span>
              <span className={styles.res}>
                <span className={styles.arrow}>→</span> <span className={`${styles.badge} ${hit ? styles.hit : styles.miss}`}>{hit ? 'CACHE HIT' : 'WAREHOUSE'}</span>{' '}
                <span className={styles.lat}>{hit ? latHit(i) : latMiss(i)}</span>
              </span>
            </div>
          );
        })}
        <div className={styles.row}>
          <span className={styles.ts}>{ts(99)}</span>
          <span className={styles.cursor} />
        </div>
      </div>
      <div className={styles.vignette} aria-hidden="true" />
    </div>
  );
};
