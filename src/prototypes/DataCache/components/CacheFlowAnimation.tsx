import React from 'react';
import { Typography } from '@/components';
import styles from './CacheFlowAnimation.module.css';

/**
 * The Caching tab's hero as motion (Vivek's concept, 4 Nov): queries from six teams
 * stream left to right in uneven bursts. Two upright geometric planes stand in the
 * path: DataCache first, the warehouse behind it. Three of every five queries turn
 * green at DataCache and sink into it; the rest dim and carry on to the warehouse.
 * Pure SVG and CSS; freezes under prefers-reduced-motion.
 */
const TEAMS = [
  { n: 'Sales', y: 30 }, { n: 'Finance', y: 62 }, { n: 'Marketing', y: 94 },
  { n: 'Support', y: 126 }, { n: 'Ops', y: 158 }, { n: 'Product', y: 190 },
];
const DUR = 11;
const lanePath = (y: number, i: number) => { const cy = 84 + (i % 4) * 18; return `M 132 ${y} C 230 ${y}, 270 ${cy}, 320 ${cy} L 700 ${cy}`; };
const BURSTS = [[0, 0.5, 1.1], [4.2, 4.8], [7.6, 8.0, 8.5]];

export const CacheFlowAnimation: React.FC<{ labels?: boolean }> = ({ labels = true }) => {
  let idx = 0;
  return (
    <div className={styles.frame} role="img" aria-label="Queries from many teams stream towards the warehouse; most are answered by DataCache on the way">
      <svg className={styles.svg} viewBox="0 0 720 230" fill="none" aria-hidden="true">
        {TEAMS.map((t, i) => (
          <path key={t.n} className={styles.lane} d={lanePath(t.y, i)} />
        ))}
        {/* DataCache: an upright geometric plane, tilted, lit */}
        <g className={styles.cache}>
          <path className={styles.cachePlane} d="M340 30 L376 18 L376 182 L340 194 Z" />
          <path className={styles.cacheEdge} d="M376 18 L376 182" />
        </g>
        {/* the warehouse: a second upright plane, further back, plainer */}
        <g className={styles.wh}>
          <path className={styles.whPlane} d="M590 54 L622 44 L622 164 L590 174 Z" />
          <path className={styles.whEdge} d="M622 44 L622 164" />
        </g>
        {TEAMS.map((t, i) => (
          <circle key={`s-${t.n}`} className={styles.source} cx="132" cy={t.y} r="3.5" style={{ animationDelay: `-${(i * 0.6).toFixed(1)}s` }} />
        ))}
        {TEAMS.flatMap((t, li) => {
          const d = lanePath(t.y, li);
          return BURSTS.flatMap((b) =>
            b.map((off, j) => {
              const caught = idx++ % 5 < 3;
              const delay = (off + li * 1.3) % DUR;
              const r = 2.2 + ((li + j) % 3) * 0.5;
              return (
                <circle
                  key={`${t.n}-${off}-${j}`}
                  className={`${styles.dot} ${caught ? styles.caught : styles.pass}`}
                  r={r}
                  style={{ offsetPath: `path('${d}')`, animationDuration: `${DUR}s`, animationDelay: `-${delay.toFixed(2)}s` } as React.CSSProperties}
                />
              );
            }),
          );
        })}
      </svg>
      {labels && (
        <>
          {TEAMS.map((t) => (
            <div key={`l-${t.n}`} className={styles.team} style={{ top: `${(t.y / 230) * 100}%` }}>
              <Typography variant="footnote" color="base" as="span" noMargin>{t.n}</Typography>
            </div>
          ))}
          <div className={styles.planeLabel} style={{ left: `${(358 / 720) * 100}%` }}>
            <Typography variant="footnote" color="base" as="span" noMargin>DataCache</Typography>
          </div>
          <div className={styles.planeLabel} style={{ left: `${(606 / 720) * 100}%` }}>
            <Typography variant="footnote" color="base" as="span" noMargin>Warehouse</Typography>
          </div>
        </>
      )}
    </div>
  );
};
