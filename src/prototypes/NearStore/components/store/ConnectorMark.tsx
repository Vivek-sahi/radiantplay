/**
 * Connector marks — one neutral silhouette per data platform, plus its name.
 *
 * Radiant carries no vendor brand logos, and faking one (a wordmark, or initials
 * in a tinted square) is worse than not having one. The reference screenshots
 * show real vendor logos because that is the shipping product.
 *
 * ⚠️ Deliberate deviation: because our mark is generic, a logo-only Source column
 * would carry no information at all. So the mark is paired with the source name.
 * That is more accessible regardless, and it is the one thing to swap back if we
 * ever license the real marks — this is the only file that would change.
 */
import React from 'react';
import { Icon, Typography } from '@/components';
import styles from './store.module.css';

type Family = 'cloud' | 'engine' | 'database' | 'file';

/** Which family a source belongs to, mirroring the picker's own grouping. */
const FAMILY: Record<string, Family> = {
  snowflake: 'cloud', databricks: 'cloud', redshift: 'cloud', bigquery: 'cloud',
  synapse: 'cloud', clickhouse: 'cloud', iomete: 'cloud',
  athena: 'engine', dremio: 'engine', presto: 'engine', starburst: 'engine', trino: 'engine',
  postgres: 'database', mysql: 'database', oracle: 'database', sqlserver: 'database',
  saphana: 'database', singlestore: 'database', denodo: 'database', aurora: 'database',
  alloydb: 'database', cloudsql: 'database',
  csv: 'file',
};

const FAMILY_ICON: Record<Family, 'collection' | 'explore' | 'database' | 'doc'> = {
  cloud: 'collection',
  engine: 'explore',
  database: 'database',
  file: 'doc',
};

export const ConnectorMark: React.FC<{
  source: string;
  label?: string;
  size?: 'xs' | 's' | 'm' | 'l';
}> = ({ source, label, size = 's' }) => (
  <span className={styles.mark}>
    <Icon name={FAMILY_ICON[FAMILY[source] ?? 'database']} size={size} />
    {label ? (
      <Typography variant="footnote" color="gray-light">
        {label}
      </Typography>
    ) : null}
  </span>
);
