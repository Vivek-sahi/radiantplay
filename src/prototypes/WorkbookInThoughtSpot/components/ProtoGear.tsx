import React from 'react';
import { ActionMenu } from '@components/ActionMenu';
import { Button } from '@components/Button';
import { Icon } from '@components/icons';
import { Tooltip } from '@components/Tooltip';
import type { WorkbookVariant } from './variant';
import styles from './ProtoGear.module.css';

// The prototype's one gear (bottom left): options to compare, not product UI. Two today: the
// workbook without a menu bar, and with the Google Sheets menu bar above the toolbar.
const OPTIONS: { label: string; value: WorkbookVariant }[] = [
  { label: 'No menu bar', value: { menuBar: false } },
  { label: 'Menu bar, as in Google Sheets', value: { menuBar: true } },
];

export const ProtoGear: React.FC<{ value: WorkbookVariant; onChange: (v: WorkbookVariant) => void }> = ({ value, onChange }) => (
  <div className={styles.gear}>
    <ActionMenu
      placement="top-start"
      trigger={
        <span>
          <Tooltip content="Prototype options" showDelay={300} hideDelay={0}>
            <Button variant="secondary" size="small" iconOnly icon="settings" iconPosition="leading">Prototype options</Button>
          </Tooltip>
        </span>
      }
    >
      <ActionMenu.Group>
        {OPTIONS.map((o) => (
          <ActionMenu.Item
            key={o.label}
            label={o.label}
            icon={value.menuBar === o.value.menuBar ? <Icon name="checkmark" size="s" /> : <span style={{ width: 16, display: 'inline-block' }} />}
            onClick={() => onChange(o.value)}
          />
        ))}
      </ActionMenu.Group>
    </ActionMenu>
  </div>
);

export default ProtoGear;
