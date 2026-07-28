import React from 'react';
import { Icon, Button } from '@/components';
import { CacheMarker } from './CacheMarker';
import styles from './SearchDataSurface.module.css';

/**
 * Search data business-user surface — the deterministic column-picker answer
 * path (recreated from the product). Like Spotter it's real-time exploration,
 * so freshness is shown UPFRONT. Two switchable placements:
 *   footer     → on the "Showing N of N rows" row (mirrors the Spotter footer)
 *   top-right  → an icon-only marker among the answer's action icons
 * Both reuse the shared CacheMarker.
 */

const ATTRIBUTES: { name: string; checked: boolean }[] = [
  { name: 'Category', checked: true },
  { name: 'Language', checked: false },
  { name: 'Platform', checked: false },
  { name: 'Property', checked: false },
  { name: 'Rank', checked: false },
  { name: 'Viewership (Mn)', checked: true },
];

const RESULT_ROWS: [string, string][] = [
  ['14.2', 'Cricket'],
  ['3.5', 'GEC Fiction'],
  ['3', 'Theatrical Film'],
  ['1.7', 'Theatrical Film'],
  ['0.7', 'Direct-to-OTT Film'],
  ['0.7', 'Reality Show'],
  ['0.6', 'Theatrical Film'],
  ['0.6', 'Reality Show'],
  ['0.5', 'Web-Series'],
  ['0.4', 'Web-Series'],
  ['4.2', 'Reality Show'],
  ['3.2', 'Theatrical Film'],
  ['2.8', 'Reality Show'],
  ['2.2', 'Theatrical Film'],
];

const RAIL: { name: React.ComponentProps<typeof Icon>['name']; active?: boolean }[] = [
  { name: 'chart', active: true },
  { name: 'table' },
  { name: 'grid-view' },
  { name: 'data-column' },
  { name: 'number-format' },
  { name: 'explore' },
];

const CheckBox: React.FC<{ checked: boolean }> = ({ checked }) => (
  <span className={[styles.cb, checked ? styles.cbOn : ''].join(' ')} aria-hidden="true">
    {checked && (
      <svg viewBox="0 0 12 12" width="10" height="10" fill="none">
        <path d="M2.5 6.2 4.7 8.4 9.5 3.6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )}
  </span>
);

export const SearchDataSurface: React.FC<{ freshnessPlacement: 'footer' | 'top-right' }> = ({
  freshnessPlacement,
}) => (
  <div className={styles.surface}>
    {/* Search bar */}
    <div className={styles.searchBar}>
      <Button variant="secondary" size="small" icon="chevron-down" iconPosition="trailing">
        OTT Clean Model
      </Button>
      <div className={styles.searchField}>
        <Icon name="search" size="s" />
        <span className={styles.token}>Viewership (Mn)</span>
        <span className={styles.token}>Category</span>
      </div>
      <button className={styles.clearBtn} aria-label="Clear">
        <Icon name="cross" size="s" />
      </button>
      <Button variant="primary" size="small">
        Go
      </Button>
    </div>

    <div className={styles.body}>
      {/* Column picker */}
      <aside className={styles.panel}>
        <div className={styles.panelTabs}>
          <span>Popular</span>
          <span className={styles.tabOn}>All</span>
        </div>
        <div className={styles.finder}>
          <Icon name="search" size="s" />
          <span>Find columns</span>
        </div>
        <button className={styles.addLink}>
          <Icon name="plus" size="s" />
          Add
        </button>

        <div className={styles.group}>
          <div className={styles.groupHead}>
            <Icon name="chevron-down" size="xs" /> Measures
          </div>
          <p className={styles.empty}>No measures available</p>
        </div>

        <div className={styles.group}>
          <div className={styles.groupHead}>
            <Icon name="chevron-down" size="xs" /> Attributes
          </div>
          {ATTRIBUTES.map((a) => (
            <label key={a.name} className={styles.col}>
              <CheckBox checked={a.checked} />
              <span className={styles.colName}>{a.name}</span>
            </label>
          ))}
        </div>

        <div className={styles.group}>
          <div className={styles.groupHead}>
            <Icon name="chevron-down" size="xs" /> Dates
          </div>
          <label className={styles.col}>
            <CheckBox checked={false} />
            <span className={styles.colName}>Launch Date</span>
          </label>
        </div>

        <div className={styles.group}>
          <div className={styles.groupHead}>
            <Icon name="chevron-down" size="xs" /> Formulas
          </div>
          <p className={styles.empty}>Click +Add to create a formula</p>
        </div>
      </aside>

      {/* Answer */}
      <main className={styles.answer}>
        <div className={styles.answerHead}>
          <div className={styles.answerTitleWrap}>
            <h2 className={styles.answerTitle}>Viewership (Mn), Category</h2>
            <span className={styles.addDesc}>Add description</span>
          </div>
          <div className={styles.actions}>
            {freshnessPlacement === 'top-right' && (
              <span className={styles.freshIcon}>
                <CacheMarker state="cached" detail="23 Jun, 9:00 AM" variant="icon" />
              </span>
            )}
            <span className={styles.toggle}>
              <span className={styles.toggleOn}>
                <Icon name="table" size="s" />
              </span>
              <span>
                <Icon name="chart" size="s" />
              </span>
            </span>
            <button className={styles.iconBtn} aria-label="Share">
              <Icon name="share" size="s" />
            </button>
            <button className={styles.iconBtn} aria-label="More">
              <Icon name="more" size="s" />
            </button>
            <Button variant="secondary" size="small" icon="chevron-down" iconPosition="trailing">
              Daily Activity Tracker
            </Button>
            <Button variant="primary" size="small">
              Pin
            </Button>
          </div>
        </div>

        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.num}>Viewership (Mn)</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {RESULT_ROWS.map((r, i) => (
                <tr key={i}>
                  <td className={styles.num}>{r[0]}</td>
                  <td>{r[1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.footer}>
          {freshnessPlacement === 'footer' && (
            <>
              <CacheMarker state="cached" detail="23 Jun, 9:00 AM" />
              <span className={styles.sep} aria-hidden="true" />
            </>
          )}
          <span>Showing 45 of 45 rows</span>
        </div>
      </main>

      {/* Viz-type rail */}
      <div className={styles.rail}>
        {RAIL.map((r, i) => (
          <button key={i} className={[styles.railBtn, r.active ? styles.railOn : ''].join(' ')} aria-label={r.name}>
            <Icon name={r.name} size="s" />
          </button>
        ))}
      </div>
    </div>
  </div>
);
