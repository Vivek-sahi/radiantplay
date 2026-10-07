import React, { useState, useCallback } from 'react';
import { Button } from '../../../components/Button';
import { sectionStyles as s } from '../styles';
import { CsvUploadModal } from './CsvUploadModal';
import { ObjectPickerModal } from './ObjectPickerModal';
import { sysVar, shadowVar } from '../../../tokens/colors';

/** Placeholder URL — replace with actual docs URL */
const LEARN_MORE_CSV_TRANSLATION_URL = '#';

interface CsvTranslationSectionProps {
  /** Whether feature is enabled at cluster level */
  clusterEnabled: boolean;
  /** Current scope: 'all-orgs' or 'org' */
  scope: 'all-orgs' | 'org';
}

export const CsvTranslationSection: React.FC<CsvTranslationSectionProps> = ({
  clusterEnabled,
  scope,
}) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [selectedObjectIds, setSelectedObjectIds] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadMode, setUploadMode] = useState<'upload' | 'replace'>('upload');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const isDisabledByCluster = scope === 'org' && !clusterEnabled;

  const handleToggleEnable = useCallback(() => {
    if (isDisabledByCluster) return;
    setIsEnabled((prev) => !prev);
    setIsEditing(false);
  }, [isDisabledByCluster]);

  const handleEdit = useCallback(() => {
    if (isDisabledByCluster) return;
    setIsEditing(true);
  }, [isDisabledByCluster]);

  const handleSave = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleUploadSuccess = useCallback((fileName: string) => {
    setCsvFileName(fileName);
    setIsUploadOpen(false);
  }, []);

  const handlePickerConfirm = useCallback((ids: string[]) => {
    setSelectedObjectIds(ids);
    setIsPickerOpen(false);
    // Simulate CSV download
    const csvContent = 'original-content,content-type,object-name,object-type,object-URL\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'translation-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div style={s.container}>
      {/* Header */}
      <div style={s.header}>
        <div style={{ flex: 1 }}>
          <h3 style={s.title}>Translate Liveboards and Answers based on CSV file</h3>
          <p style={s.description}>
            Translate meta-data of Liveboards and Answers such as titles, descriptions, tab names
            etc. into each user&apos;s preferred language based on the CSV translations uploaded by
            the Admin{' '}
            <a href={LEARN_MORE_CSV_TRANSLATION_URL} style={s.learnMore} target="_blank" rel="noopener noreferrer">
              Learn more
            </a>
          </p>
        </div>
        {!isEditing ? (
          <Button variant="secondary" onClick={handleEdit} disabled={isDisabledByCluster}>
            Edit
          </Button>
        ) : (
          <Button variant="primary" onClick={handleSave}>
            Save
          </Button>
        )}
      </div>

      {/* Disabled by cluster message */}
      {isDisabledByCluster && (
        <p style={s.disabledMessage}>
          This feature is disabled at the cluster level. Contact your cluster admin to enable it.
        </p>
      )}

      {/* Status row */}
      <div style={s.statusRow}>
        <span style={s.statusLabel}>Status</span>
        {isEditing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={handleToggleEnable}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: isDisabledByCluster ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                color: isEnabled
                  ? sysVar('content-brand')
                  : sysVar('content-secondary'),
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  width: '36px',
                  height: '20px',
                  borderRadius: '10px',
                  backgroundColor: isEnabled
                    ? sysVar('content-brand')
                    : sysVar('border-bold'),
                  position: 'relative',
                  transition: 'background-color 0.2s ease',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    left: isEnabled ? '18px' : '2px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: sysVar('content-inverse'),
                    transition: 'left 0.2s ease',
                    boxShadow: shadowVar('surface'),
                  }}
                />
              </span>
              {isEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        ) : (
          <span style={{
            ...s.statusValue,
            color: isEnabled
              ? sysVar('content-primary')
              : sysVar('content-secondary'),
          }}>
            {isEnabled ? 'Enabled' : 'Disabled'}
          </span>
        )}
      </div>

      {/* Enabled content */}
      {isEnabled && (
        <div style={s.enabledContent as React.CSSProperties}>
          {/* CSV file row */}
          <div style={s.fieldRow}>
            <span style={s.fieldLabel}>CSV translation file</span>
            {!csvFileName ? (
              <div style={s.buttonGroup}>
                <span style={s.fieldValue}>None</span>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setUploadMode('upload');
                    setIsUploadOpen(true);
                  }}
                >
                  Upload
                </Button>
              </div>
            ) : (
              <div style={s.buttonGroup}>
                <Button
                  variant="secondary"
                  onClick={() => {
                    // Simulate download
                    const blob = new Blob([''], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = csvFileName;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Download
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setUploadMode('replace');
                    setIsUploadOpen(true);
                  }}
                >
                  Replace
                </Button>
              </div>
            )}
          </div>

          {/* Object picker row */}
          <div style={s.fieldRow}>
            <span style={s.fieldLabel}>Pick Liveboards & Answers to translate</span>
            <div style={s.buttonGroup}>
              {selectedObjectIds.length > 0 && (
                <span style={s.fieldValue}>
                  {selectedObjectIds.length} {selectedObjectIds.length === 1 ? 'item' : 'items'} selected
                </span>
              )}
              <Button variant="secondary" onClick={() => setIsPickerOpen(true)}>
                {selectedObjectIds.length > 0 ? 'Change' : 'Select'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CsvUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
        mode={uploadMode}
      />
      <ObjectPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onConfirm={handlePickerConfirm}
        initialSelectedIds={selectedObjectIds}
      />
    </div>
  );
};

export default CsvTranslationSection;
