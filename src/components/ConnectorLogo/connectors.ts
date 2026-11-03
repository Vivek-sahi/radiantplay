/**
 * The connectors ThoughtSpot links to, with their logos. One list for every
 * surface that shows them: Spotter's composer, Apps sources, settings pages.
 *
 * Add a connector here once, with its logo file in src/assets/logos/connectors/.
 * A connector without a logo still works: ConnectorLogo shows its brand-colour
 * disc with an initial.
 */
import salesforce from '../../assets/logos/connectors/salesforce.svg';
import hubspot from '../../assets/logos/connectors/hubspot.svg';
import thoughtspot from '../../assets/logos/connectors/thoughtspot.svg';
import slack from '../../assets/logos/connectors/slack.png';
import gong from '../../assets/logos/connectors/gong.png';
import monday from '../../assets/logos/connectors/monday.png';

export interface ConnectorInfo {
  id: string;
  name: string;
  /** Third-party brand colour (data, not UI): the fallback disc behind the initial. */
  color: string;
  /** Logo file URL. Missing means the brand-colour disc is shown. */
  logo?: string;
  /** Single-colour logos are painted in currentColor so they follow the theme. */
  mono?: boolean;
}

export const CONNECTORS: Record<string, ConnectorInfo> = {
  thoughtspot: { id: 'thoughtspot', name: 'ThoughtSpot', color: '#1D1B18', logo: thoughtspot, mono: true },
  salesforce: { id: 'salesforce', name: 'Salesforce', color: '#00A1E0', logo: salesforce },
  hubspot: { id: 'hubspot', name: 'HubSpot', color: '#FF7A59', logo: hubspot },
  slack: { id: 'slack', name: 'Slack', color: '#611F69', logo: slack },
  gong: { id: 'gong', name: 'Gong', color: '#8039DF', logo: gong },
  monday: { id: 'monday', name: 'monday.com', color: '#FF3D57', logo: monday },
  gworkspace: { id: 'gworkspace', name: 'Google Workspace', color: '#4285F4' },
  onedrive: { id: 'onedrive', name: 'OneDrive', color: '#0078D4' },
  canva: { id: 'canva', name: 'Canva', color: '#7D2AE8' },
  notion: { id: 'notion', name: 'Notion', color: '#111827' },
  dropbox: { id: 'dropbox', name: 'Dropbox', color: '#0061FF' },
  figma: { id: 'figma', name: 'Figma', color: '#A259FF' },
};

export type ConnectorId = keyof typeof CONNECTORS;
