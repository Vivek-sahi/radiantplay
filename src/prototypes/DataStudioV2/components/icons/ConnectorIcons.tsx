/**
 * Connector marks — one line-drawn silhouette per data platform.
 *
 * Radiant carries no vendor brand logos, and drawing a vendor's actual logo (or
 * faking one with its initials in a tinted square, which is what the agent's
 * connection list used to do) is worse than not having one. These are neutral
 * silhouettes that read as a single set: same 16px viewBox, same stroke weight,
 * same colour as the structural icons they sit beside.
 *
 * Lifted out of ModelCanvas so the canvas data browser and the agent thread's
 * ConnectionList show the same mark for the same connection — S2 lists the
 * connections in chat, and a minute later the browser shows them on the canvas.
 */
import React from 'react';
import { Icon } from '../../../../components/icons';
import snowflakeBrand from '../../assets/connectors/snowflake.svg';
import databricksBrand from '../../assets/connectors/databricks.svg';
import csvBrand from '../../assets/connectors/csv.svg';
import pythonBrand from '../../assets/connectors/python.svg';
import salesforceBrand from '../../assets/connectors/salesforce.svg';
import postgresBrand from '../../assets/connectors/postgres.svg';

export interface ConnectorIconProps {
  size?: number;
  color?: string;
}

const DEFAULT_COLOR = '#8B96A5';

const stroke = (d: React.ReactNode, { size = 12, color = DEFAULT_COLOR }: ConnectorIconProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color }}>
    {d}
  </svg>
);

/** Six-way radial, after the snowflake figure. */
export const SnowflakeMark: React.FC<ConnectorIconProps> = p =>
  stroke(<path d="M8 2v12M2.8 5l10.4 6M13.2 5L2.8 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>, p);

/** Stacked lakehouse layers. */
export const DatabricksMark: React.FC<ConnectorIconProps> = p =>
  stroke(<path d="M2 6l6 3.2L14 6M2 9.2l6 3.2 6-3.2M8 3l6 3.2L8 9.4 2 6.2 8 3z" stroke="currentColor" strokeWidth="1.15" strokeLinejoin="round" strokeLinecap="round"/>, p);

/** Rotated square with a cross, after the BigQuery figure. */
export const BigqueryMark: React.FC<ConnectorIconProps> = p =>
  stroke(<>
    <path d="M8 2.4l5 5-5 5-5-5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    <path d="M8 5.6v4.8M5.6 8h4.8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
  </>, p);

/** Cloud — Salesforce's own figure is a cloud, so this stays recognisable
 *  without reproducing the logo. */
export const SalesforceMark: React.FC<ConnectorIconProps> = p =>
  stroke(<path d="M5 12.5A3 3 0 0 1 4.5 6.55 3.8 3.8 0 0 1 11.8 7a2.75 2.75 0 0 1-.55 5.5H5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>, p);

/** Relational cylinder — the generic figure, right for Postgres and Redshift. */
export const PostgresMark: React.FC<ConnectorIconProps> = p =>
  stroke(<>
    <ellipse cx="8" cy="4.2" rx="4.6" ry="1.8" stroke="currentColor" strokeWidth="1.25"/>
    <path d="M3.4 4.2v7.6c0 1 2.06 1.8 4.6 1.8s4.6-.8 4.6-1.8V4.2" stroke="currentColor" strokeWidth="1.25"/>
    <path d="M3.4 8c0 1 2.06 1.8 4.6 1.8S12.6 9 12.6 8" stroke="currentColor" strokeWidth="1.25"/>
  </>, p);

/** Hexagon, after the dbt figure. */
export const DbtMark: React.FC<ConnectorIconProps> = p =>
  stroke(<path d="M8 2.2l5.2 3v5.6L8 13.8l-5.2-3V5.2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>, p);

/** File-store connections (Drive, SharePoint) fall back to Radiant's folder. */
export const FolderMark: React.FC<ConnectorIconProps> = ({ color = DEFAULT_COLOR }) => (
  <Icon name="folder" size="xs" color={color} />
);

// ── Brand marks ──────────────────────────────────────────────────────────────
/**
 * The real vendor logos, in colour — for the demo, where a source has to be
 * recognised at a glance rather than read.
 *
 * These sit alongside the silhouettes above rather than replacing them, and the
 * distinction is deliberate. The silhouettes exist because Radiant ships no
 * vendor logos and *inventing* one (initials in a tinted square) is worse than
 * having none. Using a vendor's actual mark to identify a genuine integration
 * is a different thing, and it's what every data tool does — colour is how you
 * tell Snowflake from Databricks without stopping to read. That distinction
 * carries a beat in the run-of-show: S6 only makes sense if you can see at a
 * glance that the canvas holds two different warehouses.
 *
 * Covers the two warehouses the model is built from, the two other connections
 * S2 offers her, and the two non-vendor sources (an uploaded file, an agent-written
 * script). Anything else — BigQuery, Redshift, dbt, Drive, SharePoint — falls back
 * to its silhouette via `SourceMark` returning null. See CONNECTOR_MARK.
 *
 * All but Postgres are under Vite's 4kb inline limit, so they build to data URIs;
 * Postgres is 15kb and becomes its own request.
 *
 * Longer term the intent is illustrations rather than vendor logos; this is the
 * demo-accurate step, not the destination.
 */
const BRAND_SRC: Record<string, string> = {
  snowflake:  snowflakeBrand,
  databricks: databricksBrand,
  salesforce: salesforceBrand,
  postgres:   postgresBrand,
  csv:        csvBrand,
  python:     pythonBrand,
};

export const hasBrandMark = (key: string | null | undefined): boolean =>
  Boolean(key && BRAND_SRC[key]);

/**
 * Named `SourceMark`, not `BrandMark` — `BrandMark` is already the ThoughtSpot
 * logo in `components/BrandMark`, and ModelCanvas imports both.
 */
export const SourceMark: React.FC<{ name: string; size?: number }> = ({ name, size = 14 }) => {
  const src = BRAND_SRC[name];
  if (!src) return null;
  return (
    <img
      src={src}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    />
  );
};

export const CONNECTOR_MARK: Record<string, React.FC<ConnectorIconProps>> = {
  snowflake:  SnowflakeMark,
  databricks: DatabricksMark,
  bigquery:   BigqueryMark,
  salesforce: SalesforceMark,
  postgres:   PostgresMark,
  redshift:   PostgresMark,
  dbt:        DbtMark,
  gdrive:     FolderMark,
  sharepoint: FolderMark,
};
