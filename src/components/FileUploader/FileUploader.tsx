import React, { forwardRef, useId, useRef, useState } from 'react';
import { Button } from '../Button';
import { Icon } from '../icons';
import { ProgressBar } from '../ProgressBar';
import styles from './FileUploader.module.css';

export type FileUploaderStatus = 'idle' | 'uploading' | 'complete' | 'error';

export interface FileUploaderItem {
  /** Stable id for the file */
  id: string;
  /** File name shown in the field and the list */
  name: string;
  /** Size in bytes, shown in the list */
  size?: number;
  /** The browser File, when it came from the picker or a drop */
  file?: File;
  /**
   * Upload status. Nothing uploads for real: set this from your prototype.
   * @default 'idle'
   */
  status?: FileUploaderStatus;
  /** Upload progress 0 to 100, shown while status is 'uploading' */
  progress?: number;
  /** Message shown when status is 'error' */
  errorMessage?: string;
}

export interface FileUploaderProps {
  /** Label above the field */
  label?: string;
  /** Helper text after the label, shown in brackets as in Figma */
  helperText?: string;
  /** Placeholder inside the empty field */
  placeholder?: string;
  /**
   * Upload button label
   * @default 'Upload'
   */
  buttonLabel?: string;
  /** Files (controlled) */
  files?: FileUploaderItem[];
  /** Starting files when uncontrolled */
  defaultFiles?: FileUploaderItem[];
  /** Called with the full list whenever files are added or removed */
  onFilesChange?: (files: FileUploaderItem[]) => void;
  /** Accepted types, passed to the file input, e.g. ".csv,.xlsx" */
  accept?: string;
  /** Allow more than one file. A new pick adds to the list instead of replacing it */
  multiple?: boolean;
  /**
   * Show the file list with size, progress, complete and error per file.
   * Defaults to on when `multiple` is set or any file has a status other than 'idle'.
   */
  showFileList?: boolean;
  /** Error state */
  error?: boolean;
  /** Error message, shown in place of the label as in Figma */
  errorMessage?: string;
  /** Disabled: the whole control at 40% */
  disabled?: boolean;
  /** Read-only: filled field, no border, no remove, Upload disabled */
  readOnly?: boolean;
  /** Additional CSS class name */
  className?: string;
}

let uid = 0;
const toItems = (list: FileList | File[]): FileUploaderItem[] =>
  Array.from(list).map((file) => ({
    id: `file-${Date.now()}-${(uid += 1)}`,
    name: file.name,
    size: file.size,
    file,
    status: 'idle' as const,
  }));

const formatSize = (bytes?: number): string => {
  if (bytes === undefined) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * FileUploader
 *
 * The Figma File uploader (370:19703): a label row, a 32px field that shows the
 * chosen file name with a clear button, and a secondary Upload button. The
 * field is also a drop target with a drag-over state. States: default, hover,
 * focus, filled, error, disabled and read-only.
 *
 * Nothing uploads: the component reports picks and removals through
 * `onFilesChange`, and the prototype sets `status` and `progress` per file to
 * show uploading, complete or error in the file list.
 *
 * @example
 * ```tsx
 * <FileUploader label="Data file" helperText="CSV up to 50 MB" accept=".csv" onFilesChange={setFiles} />
 * <FileUploader label="Attachments" multiple files={files} onFilesChange={setFiles} />
 * ```
 */
export const FileUploader = forwardRef<HTMLDivElement, FileUploaderProps>(({
  label,
  helperText,
  placeholder,
  buttonLabel = 'Upload',
  files,
  defaultFiles = [],
  onFilesChange,
  accept,
  multiple = false,
  showFileList,
  error = false,
  errorMessage,
  disabled = false,
  readOnly = false,
  className,
}, ref) => {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const isControlled = files !== undefined;
  const [inner, setInner] = useState<FileUploaderItem[]>(defaultFiles);
  const current = isControlled ? files : inner;
  const [dragOver, setDragOver] = useState(false);
  const dragDepth = useRef(0);

  const interactive = !disabled && !readOnly;

  const update = (next: FileUploaderItem[]) => {
    if (!isControlled) setInner(next);
    onFilesChange?.(next);
  };

  const add = (list: FileList | File[]) => {
    const picked = toItems(list);
    if (picked.length === 0) return;
    update(multiple ? [...current, ...picked] : picked.slice(0, 1));
  };

  const remove = (itemId: string) => update(current.filter((f) => f.id !== itemId));
  const clear = () => update([]);

  const browse = () => {
    if (interactive) inputRef.current?.click();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    if (!interactive) return;
    e.preventDefault();
    dragDepth.current += 1;
    setDragOver(true);
  };
  const handleDragOver = (e: React.DragEvent) => {
    if (!interactive) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };
  const handleDragLeave = () => {
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    if (!interactive) return;
    e.preventDefault();
    dragDepth.current = 0;
    setDragOver(false);
    add(e.dataTransfer.files);
  };

  const hasFiles = current.length > 0;
  const fieldText = !hasFiles
    ? placeholder
    : current.length === 1
      ? current[0].name
      : `${current.length} files`;
  const listOn = showFileList ?? (multiple || current.some((f) => (f.status ?? 'idle') !== 'idle'));
  const showErrorLabel = error && errorMessage;

  const rootClasses = [
    styles.root,
    error && styles.error,
    disabled && styles.disabled,
    readOnly && styles.readOnly,
    dragOver && styles.dragOver,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div ref={ref} className={rootClasses}>
      {(label || showErrorLabel || helperText) && (
        <div className={styles.labelRow} id={`${id}-label`}>
          {showErrorLabel ? (
            <>
              <span className={styles.errorIcon} aria-hidden>
                <Icon name="exclamation-point-circle" size="xs" />
              </span>
              <span className={styles.errorText} role="alert">{errorMessage}</span>
            </>
          ) : (
            label && <span className={styles.label}>{label}</span>
          )}
          {helperText && <span className={styles.helper}>({helperText})</span>}
        </div>
      )}

      <div className={styles.row}>
        <div
          className={styles.fieldWrap}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div
            role="button"
            tabIndex={interactive ? 0 : -1}
            aria-labelledby={label || showErrorLabel || helperText ? `${id}-label ${id}-value` : undefined}
            aria-label={label || showErrorLabel || helperText ? undefined : 'Choose a file'}
            aria-invalid={error || undefined}
            aria-disabled={!interactive || undefined}
            className={styles.field}
            onClick={browse}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                browse();
              }
            }}
          >
            <span
              id={`${id}-value`}
              className={[styles.value, !hasFiles && styles.placeholder].filter(Boolean).join(' ')}
            >
              {dragOver ? 'Drop to add' : fieldText}
            </span>
          </div>
          {hasFiles && interactive && !dragOver && (
            <span className={styles.clear}>
              <Button
                variant="tertiary"
                size="xs"
                iconOnly
                icon="cross"
                aria-label={current.length === 1 ? `Remove ${current[0].name}` : 'Remove all files'}
                onClick={clear}
              >
                Remove
              </Button>
            </span>
          )}
        </div>
        <Button variant="secondary" disabled={!interactive} onClick={browse}>
          {buttonLabel}
        </Button>
        <input
          ref={inputRef}
          type="file"
          className={styles.hiddenInput}
          accept={accept}
          multiple={multiple}
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            if (e.target.files) add(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {listOn && hasFiles && (
        <ul className={styles.list} aria-label="Files">
          {current.map((item) => {
            const status = item.status ?? 'idle';
            return (
              <li key={item.id} className={[styles.item, styles[status]].filter(Boolean).join(' ')}>
                <span className={styles.itemIcon} aria-hidden>
                  <Icon name="doc" size="m" />
                </span>
                <span className={styles.itemBody}>
                  <span className={styles.itemTop}>
                    <span className={styles.itemName}>{item.name}</span>
                    {item.size !== undefined && status !== 'error' && (
                      <span className={styles.itemMeta}>{formatSize(item.size)}</span>
                    )}
                  </span>
                  {status === 'uploading' && (
                    <ProgressBar
                      value={item.progress ?? 0}
                      color="blue"
                      size="small"
                      label={`Uploading ${item.name}`}
                    />
                  )}
                  {status === 'error' && (
                    <span className={styles.itemError}>{item.errorMessage ?? 'Upload failed'}</span>
                  )}
                </span>
                {status === 'complete' && (
                  <span className={styles.itemDone} aria-label="Uploaded" role="img">
                    <Icon name="checkmark-circle" size="m" />
                  </span>
                )}
                {status === 'error' && (
                  <span className={styles.itemFailed} aria-hidden>
                    <Icon name="exclamation-point-circle" size="m" />
                  </span>
                )}
                {interactive && (
                  <Button
                    variant="tertiary"
                    size="xs"
                    iconOnly
                    icon="cross"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => remove(item.id)}
                  >
                    Remove
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});

FileUploader.displayName = 'FileUploader';

export default FileUploader;
