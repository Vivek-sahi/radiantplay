import React, { useState, useEffect } from 'react';
import { Button } from '@components/Button';
import { ActionMenu } from '@components/ActionMenu';
import { InlineEdit } from '@components/InlineEdit';
import { Modal } from '@components/Modal';
import { ConfirmDialog } from '@components/ConfirmDialog';
import { Tooltip } from '@components/Tooltip';
import { Typography } from '@components/Typography';
import { Horizontal, Vertical } from '@components/Layout';
import { Icon } from '@components/icons';
import type { Workbook } from '../engine/workbook';
import { ShareDialog } from './ShareDialog';
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
  /** Published versions, newest last. */
  versions: { n: number; at: string }[];
  /** Restore the last published version into the draft (Model C: no stepping back through drafts). */
  onRestore: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onSchedule: () => void;
  onDelete: () => void;
  /** Opens one of the header's dialogs from elsewhere (the File menu). `n` changes on every request. */
  open?: { what: 'share' | 'versions' | 'details' | 'delete'; n: number };
}

// Tab kind icons (Vivek, 3 Nov): Live = warehouse connection, Input = editable, Local = stored in this workbook.
const KIND_ICON = { live: 'database', input: 'pencil', local: 'doc', app: 'apps' } as const;
const KIND_LABEL = { live: 'Live', input: 'Input', local: 'Local', app: 'App' } as const;

export const WorkbookHeader: React.FC<WorkbookHeaderProps> = ({ wb, onRename, publishCount, dirty, unsavedInputs, onPublish, versions, onRestore, onCopy, onDownload, onSchedule, onDelete, open }) => {
  const [info, setInfo] = useState(false);
  const [history, setHistory] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [share, setShare] = useState(false);
  useEffect(() => {
    if (!open) return;
    if (open.what === 'share') setShare(true);
    if (open.what === 'versions') setHistory(true);
    if (open.what === 'details') setInfo(true);
    if (open.what === 'delete') setConfirmDelete(true);
  }, [open]);
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
        {/* ⋯ sits before Share (Vivek, 3 Nov) */}
        <ActionMenu
          placement="bottom-end"
          trigger={<Button className={styles.quiet} variant="tertiary" size="small" iconOnly icon="more" iconPosition="leading">More workbook actions</Button>}
        >
          <ActionMenu.Group>
            <ActionMenu.Item label="Version history" icon={<Icon name="clock" size="s" />} disabled={!published} onClick={() => setHistory(true)} />
            <ActionMenu.Item label="Make a copy" icon={<Icon name="copy" size="s" />} onClick={onCopy} />
            <ActionMenu.Item label="Download as Excel" icon={<Icon name="download" size="s" />} onClick={onDownload} />
            <ActionMenu.Item label="Schedule" icon={<Icon name="calendar-cleaned" size="s" />} disabled={!published} onClick={onSchedule} />
          </ActionMenu.Group>
          <ActionMenu.Group>
            <ActionMenu.Item label="Delete" icon={<Icon name="delete" size="s" />} destructive onClick={() => setConfirmDelete(true)} />
          </ActionMenu.Group>
        </ActionMenu>
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
      </Horizontal>

      <Modal isOpen={info} onClose={() => setInfo(false)} title="Workbook details" size="medium">
        <Vertical gap={16}>
          <Typography variant="body-normal" color="gray">Where each tab’s data comes from. Live tabs read a data model; input tabs write to a table in your warehouse; local tabs live only in this workbook.</Typography>
          <div className={styles.sources}>
            {wb.sheets.map((s) => (
              <div key={s.id} className={styles.sourceRow}>
                <Icon name={KIND_ICON[s.kind]} size="s" className={`${styles.kindIcon} ${styles[s.kind]}`} />
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

      <Modal isOpen={history} onClose={() => setHistory(false)} title="Version history" size="medium">
        <div className={styles.sources}>
          {isDraft && (
            <div className={styles.versionRow}>
              <div className={styles.versionMeta}>
                <span className={styles.sourceName}>Draft</span>
                <span className={styles.sourceWhere}>Your changes since the last publish. Only editors see them.</span>
              </div>
            </div>
          )}
          {[...versions].reverse().map((v, i) => (
            <div key={v.n} className={styles.versionRow}>
              <div className={styles.versionMeta}>
                <span className={styles.sourceName}>Version {v.n}{i === 0 ? ' · what everyone sees' : ''}</span>
                <span className={styles.sourceWhere}>Published by you · {v.at}</span>
              </div>
              {i === 0 && dirty && (
                <Button variant="secondary" size="small" onClick={() => { onRestore(); setHistory(false); }}>Restore into draft</Button>
              )}
            </div>
          ))}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDelete}
        title={`Delete ${wb.name}?`}
        message="The workbook and its local tabs are deleted for everyone. Values already saved to the warehouse stay there."
        confirmText="Delete"
        status="danger"
        onConfirm={() => { setConfirmDelete(false); onDelete(); }}
        onCancel={() => setConfirmDelete(false)}
      />

      <ShareDialog isOpen={share} objectName={wb.name} onClose={() => setShare(false)} onShared={() => setShare(false)} />
    </div>
  );
};

export default WorkbookHeader;
