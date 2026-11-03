import React, { useState, useRef, useCallback } from 'react';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { Icon } from '../../../components/icons';
import { LoadingIndicator } from '../../../components/LoadingIndicator';
import { uploadModalStyles as s } from '../styles';
import { csvRequiredHeaders, type CsvValidationError } from '../data/mockData';
import { sysVar } from '../../../tokens/colors';

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (fileName: string) => void;
  mode: 'upload' | 'replace';
}

type ValidationState = 'idle' | 'validating' | 'success' | 'error';

function validateCsvFile(file: File): Promise<{ valid: boolean; errors: CsvValidationError[] }> {
  return new Promise((resolve) => {
    // Simulate validation delay
    setTimeout(() => {
      const errors: CsvValidationError[] = [];

      // Check file extension
      if (!file.name.toLowerCase().endsWith('.csv')) {
        errors.push({
          type: 'invalid-format',
          message: 'Invalid file format',
          details: `Expected a .csv file but received "${file.name.split('.').pop()}". Please upload a valid CSV file.`,
        });
        resolve({ valid: false, errors });
        return;
      }

      // Check empty file
      if (file.size === 0) {
        errors.push({
          type: 'empty',
          message: 'Empty file',
          details: 'The uploaded CSV file is empty. Please upload a file with translation data.',
        });
        resolve({ valid: false, errors });
        return;
      }

      // Read and validate headers
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          if (!text || text.trim().length === 0) {
            errors.push({
              type: 'empty',
              message: 'Empty file',
              details: 'The uploaded CSV file contains no data. Please upload a file with translation data.',
            });
            resolve({ valid: false, errors });
            return;
          }

          const firstLine = text.split('\n')[0];
          if (!firstLine) {
            errors.push({
              type: 'corrupt',
              message: 'Corrupt file',
              details: 'Unable to read the CSV file. The file may be corrupted or have an unsupported encoding.',
            });
            resolve({ valid: false, errors });
            return;
          }

          const headers = firstLine.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
          const missingHeaders = csvRequiredHeaders.filter((h) => !headers.includes(h));

          if (missingHeaders.length > 0) {
            errors.push({
              type: 'missing-headers',
              message: 'Missing required headers',
              details: `The following required column headers are missing: ${missingHeaders.join(', ')}. Please ensure your CSV includes all required headers.`,
            });
          }

          // Check for data rows
          const lines = text.trim().split('\n');
          if (lines.length < 2) {
            errors.push({
              type: 'invalid-rows',
              message: 'No data rows',
              details: 'The CSV file contains headers but no translation data rows.',
            });
          }

          resolve({ valid: errors.length === 0, errors });
        } catch {
          errors.push({
            type: 'corrupt',
            message: 'Corrupt file',
            details: 'Unable to parse the CSV file. Please check that the file is not corrupted and uses UTF-8 encoding.',
          });
          resolve({ valid: false, errors });
        }
      };
      reader.onerror = () => {
        errors.push({
          type: 'encoding',
          message: 'File read error',
          details: 'Unable to read the file. Please ensure the file uses UTF-8 encoding and is not corrupted.',
        });
        resolve({ valid: false, errors });
      };
      reader.readAsText(file);
    }, 1200);
  });
}

export const CsvUploadModal: React.FC<CsvUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  mode,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationState, setValidationState] = useState<ValidationState>('idle');
  const [validationErrors, setValidationErrors] = useState<CsvValidationError[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setSelectedFile(null);
    setValidationState('idle');
    setValidationErrors([]);
    setIsDragOver(false);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  const handleFileSelect = useCallback(async (file: File) => {
    // Only allow CSV
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setSelectedFile(file);
      setValidationState('error');
      setValidationErrors([{
        type: 'invalid-format',
        message: 'Invalid file format',
        details: `Only CSV files are supported. "${file.name}" is not a valid CSV file.`,
      }]);
      return;
    }

    setSelectedFile(file);
    setValidationState('validating');
    setValidationErrors([]);

    const result = await validateCsvFile(file);
    if (result.valid) {
      setValidationState('success');
    } else {
      setValidationState('error');
      setValidationErrors(result.errors);
    }
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const handleConfirm = useCallback(() => {
    if (selectedFile && validationState === 'success') {
      onUploadSuccess(selectedFile.name);
      resetState();
    }
  }, [selectedFile, validationState, onUploadSuccess, resetState]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'upload' ? 'Upload CSV translation file' : 'Replace CSV translation file'}
      size="M1"
      showCloseButton
      footer={
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', width: '100%' }}>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={validationState !== 'success'}
          >
            {mode === 'upload' ? 'Upload' : 'Replace'}
          </Button>
        </div>
      }
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />

      {/* Dropzone */}
      {!selectedFile && (
        <div
          style={{
            ...s.dropzone,
            ...(isDragOver ? s.dropzoneActive : {}),
          }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          <Icon name="upload" size="l" color={sysVar('content-tertiary')} />
          <p style={{ ...s.dropzoneLabel, marginTop: '12px' }}>
            Drag and drop your CSV file here, or{' '}
            <span style={s.dropzoneBrowse}>browse</span>
          </p>
          <p style={{ fontSize: '12px', color: sysVar('content-tertiary'), margin: '8px 0 0' }}>
            Only .csv files are supported
          </p>
        </div>
      )}

      {/* Selected file info */}
      {selectedFile && (
        <div style={s.fileInfo}>
          <Icon name="documentation" size="s" color={sysVar('content-secondary')} />
          <span style={s.fileName}>{selectedFile.name}</span>
          <span style={s.fileSize}>{formatFileSize(selectedFile.size)}</span>
          {validationState !== 'validating' && (
            <span
              style={{ cursor: 'pointer', display: 'flex' }}
              onClick={() => {
                resetState();
              }}
            >
              <Icon name="cross" size="s" color={sysVar('content-tertiary')} />
            </span>
          )}
        </div>
      )}

      {/* Validation loading */}
      {validationState === 'validating' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
          <LoadingIndicator size="small" />
          <span style={{ fontSize: '14px', color: sysVar('content-secondary') }}>
            Validating CSV file...
          </span>
        </div>
      )}

      {/* Validation success */}
      {validationState === 'success' && (
        <div style={{ ...s.validationStatus, ...s.validationSuccess }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="checkmark-circle" size="s" color={sysVar('content-success')} />
            <p style={{ ...s.validationTitle, color: sysVar('content-success') }}>
              File validated successfully
            </p>
          </div>
          <p style={s.validationMessage}>
            The CSV file is valid and ready to be uploaded.
          </p>
        </div>
      )}

      {/* Validation errors */}
      {validationState === 'error' && validationErrors.length > 0 && (
        <div style={{ ...s.validationStatus, ...s.validationError }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="exclamation-point-circle" size="s" color={sysVar('content-failure')} />
            <p style={{ ...s.validationTitle, color: sysVar('content-failure') }}>
              Validation failed
            </p>
          </div>
          {validationErrors.map((error, i) => (
            <div key={i}>
              <p style={{ ...s.validationMessage, fontWeight: 500 }}>{error.message}</p>
              {error.details && <p style={s.validationMessage}>{error.details}</p>}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default CsvUploadModal;
