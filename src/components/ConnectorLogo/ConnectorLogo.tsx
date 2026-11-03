import { forwardRef } from 'react';
import { CONNECTORS } from './connectors';
import styles from './ConnectorLogo.module.css';

export interface ConnectorLogoProps {
  /** Connector id from CONNECTORS, e.g. 'salesforce' or 'slack'. */
  id: string;
  /** Width and height in px. Defaults to 16. */
  size?: number;
  /** Shown as the initial and fallback when the id isn't in CONNECTORS. */
  name?: string;
  /** Brand colour for the fallback disc when the id isn't in CONNECTORS. */
  color?: string;
  /** Accessible name. Defaults to the connector's name; pass '' when a label sits beside it. */
  label?: string;
  className?: string;
}

/**
 * A connector's logo (Salesforce, Slack, ThoughtSpot...), from the one shared
 * list in connectors.ts. Without a logo file it shows the brand-colour disc and
 * the connector's initial, so every connector renders something.
 *
 * @example
 * <ConnectorLogo id="salesforce" />
 * <ConnectorLogo id="slack" size={20} label="" />
 */
export const ConnectorLogo = forwardRef<HTMLSpanElement, ConnectorLogoProps>(
  ({ id, size = 16, name, color, label, className }, ref) => {
    const info = CONNECTORS[id];
    const displayName = info?.name ?? name ?? id;
    const a11y = label ?? displayName;
    const box = { width: size, height: size };
    const classes = [styles.logo, className].filter(Boolean).join(' ');

    if (info?.logo && info.mono) {
      return (
        <span ref={ref} className={classes} style={box} role={a11y ? 'img' : undefined} aria-label={a11y || undefined} aria-hidden={a11y ? undefined : true}>
          <span className={styles.mono} style={{ ['--connector-logo-src' as string]: `url(${info.logo})` }} />
        </span>
      );
    }
    if (info?.logo) {
      return (
        <span ref={ref} className={classes} style={box}>
          <img className={styles.image} src={info.logo} alt={a11y} />
        </span>
      );
    }
    return (
      <span
        ref={ref}
        className={[classes, styles.fallback].join(' ')}
        style={{ ...box, background: info?.color ?? color, fontSize: Math.round(size * 0.68) }}
        role={a11y ? 'img' : undefined}
        aria-label={a11y || undefined}
        aria-hidden={a11y ? undefined : true}
      >
        {displayName.charAt(0)}
      </span>
    );
  }
);

ConnectorLogo.displayName = 'ConnectorLogo';
