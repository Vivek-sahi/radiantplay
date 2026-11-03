import React, { useState } from 'react';
import { Button } from '@components/Button';
import { ActionMenu } from '@components/ActionMenu';
import { InlineEdit } from '@components/InlineEdit';
import { Modal } from '@components/Modal';
import { Tooltip } from '@components/Tooltip';
import { Typography } from '@components/Typography';
import { Horizontal, Vertical } from '@components/Layout';
import { Icon } from '@components/icons';
import type { Workbook } from '../engine/workbook';
import styles from './WorkbookHeader.module.css';

// The workbook's header: workbook-level things only (Vivek, 3 Nov 2026).
// Lifecycle follows Faris's Apps (Model C): a draft autosaves; the first Publish makes the version
// everyone sees and turns Share on; editing after that flips the header back to Draft and the
// button to "Publish changes". Buttons never disappear: when they can't act they dim and say why,
// so the header never reflows. The rarer workbook actions sit in ⋯. The models and tables behind
// the workbook are under the info icon. Sheet-level actions live on the tabs, not here.

export interface WorkbookHeaderProps {
  wb: Workbook;
  onRename: (name: string) => void;
  /** Times published; 0 = never. */
  publishCount: number;
  /** Changed since the last publish. */
  dirty: boolean;
  /** Input tabs with values not yet saved to the warehouse. */
  unsavedInputs: number;
  onPublish: () => void;
}

const KIND_LABEL = { live: 'Live', input: 'Input', local: 'Local' } as const;

export const WorkbookHeader: React.FC<WorkbookHeaderProps> = ({ wb, onRename, publishCount, dirty, unsavedInputs, onPublish }) => {
  const [info, setInfo] = useState(false);
  const [share, setShare] = useState(false);
  const published = publishCount > 0;
  const isDraft = !published || dirty;
  const canPublish = !published || dirty;
  const publishLabel = published ? 'Publish changes' : 'Publish';
  const publishReason = !canPublish ? 'Nothing new to publish: everyone already sees this version' : unsavedInputs ? 'Some input values aren’t saved to the warehouse yet. Publishing shares the workbook, not those values.' : '';

  return (
    <div className={styles.header}>
      <Horizontal gap={8} align="center" className={styles.left}>
        <Icon name="table" size="m" />
        <InlineEdit className={styles.title} value={wb.name} onChange={(v) => v.trim() && onRename(v.trim())} confirmOnBlur required />
        {isDraft && <span className={styles.draft}>Draft</span>}
        <Tooltip content="Workbook details" showDelay={400} hideDelay={0}>
          <Button className={styles.quiet} variant="tertiary" size="small" iconOnly icon="info-circle" iconPosition="leading" onClick={() => setInfo(true)}>Workbook details</Button>
        </Tooltip>
      </Horizontal>

      <Horizontal gap={8} align="center">
        <Tooltip content={published ? 'Share this workbook' : 'Publish first. A draft isn’t shared; publishing makes the version people see.'} showDelay={300} hideDelay={0}>
          <Button variant="secondary" size="small" disabled={!published} onClick={() => setShare(true)}>Share</Button>
        </Tooltip>
        {publishReason ? (
          <Tooltip content={publishReason} showDelay={300} hideDelay={0}>
            <Button variant="primary" size="small" disabled={!canPublish} onClick={onPublish}>{publishLabel}</Button>
          </Tooltip>
        ) : (
          <Button variant="primary" size="small" onClick={onPublish}>{publishLabel}</Button>
        )}
        <ActionMenu
          placement="bottom-end"
          trigger={<Button className={styles.quiet} variant="tertiary" size="small" iconOnly icon="more" iconPosition="leading">More workbook actions</Button>}
        >
          <ActionMenu.Item label="Version history" icon={<Icon name="clock" size="s" />} disabled={!published} />
          <ActionMenu.Item label="Make a copy" icon={<Icon name="copy" size="s" />} />
          <ActionMenu.Item label="Download as Excel" icon={<Icon name="download" size="s" />} />
          <ActionMenu.Item label="Schedule" icon={<Icon name="calendar-cleaned" size="s" />} disabled={!published} />
          <ActionMenu.Item label="Delete" icon={<Icon name="delete" size="s" />} destructive />
        </ActionMenu>
      </Horizontal>

      <Modal isOpen={info} onClose={() => setInfo(false)} title="Workbook details" size="medium">
        <Vertical gap={16}>
          <Typography variant="body-normal" color="gray">Where each tab’s data comes from. Live tabs read a data model; input tabs write to a table in your warehouse; local tabs live only in this workbook.</Typography>
          <div className={styles.sources}>
            {wb.sheets.map((s) => (
              <div key={s.id} className={styles.sourceRow}>
                <span className={`${styles.dot} ${styles[s.kind]}`} />
                <span className={styles.sourceName}>{s.name}</span>
                <span className={styles.sourceKind}>{KIND_LABEL[s.kind]}</span>
                <span className={styles.sourceWhere}>{s.source ?? (s.kind === 'local' ? 'Only in this workbook' : '')}</span>
              </div>
            ))}
          </div>
          {Object.keys(wb.names).length > 0 && (
            <Typography variant="footnote" color="gray">Named values: {Object.entries(wb.names).map(([n, r]) => `${n} (${r})`).join(', ')}</Typography>
          )}
          <Typography variant="footnote" color="gray">Owner: you · {published ? `Published ${publishCount} ${publishCount === 1 ? 'time' : 'times'}` : 'Not published yet'}</Typography>
        </Vertical>
      </Modal>

      <Modal
        isOpen={share}
        onClose={() => setShare(false)}
        title={`Share ${wb.name}`}
        size="small"
        footer={<Button variant="primary" onClick={() => setShare(false)}>Share</Button>}
      >
        <Typography variant="body-normal" color="gray">People you share with see the published version. Can edit lets them change the draft.</Typography>
      </Modal>
    </div>
  );
};

export default WorkbookHeader;
