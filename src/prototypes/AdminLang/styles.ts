import { CSSProperties } from 'react';
import { systemColors, referenceColors } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';

const FONT_FAMILY = 'var(--font-family-primary)';

/** Main content area styles */
export const contentStyles = {
  page: {
    padding: `${spacing.F}px ${spacing.H}px`,
    fontFamily: FONT_FAMILY,
    maxWidth: '900px',
  } as CSSProperties,
};

/** Settings section styles — each settings card (Auto-translate, CSV translate, etc.) */
export const sectionStyles = {
  container: {
    padding: `${spacing.F}px 0`,
    borderBottom: `1px solid ${referenceColors.gray['20']}`,
  } as CSSProperties,

  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: `${spacing.D}px`,
    marginBottom: `${spacing.D}px`,
  } as CSSProperties,

  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: `${spacing.C}px`,
  } as CSSProperties,

  title: {
    fontSize: '18px',
    fontWeight: 'var(--font-weight-emphasis)',
    color: systemColors.light['content-primary'],
    margin: 0,
    lineHeight: 1.4,
  } as CSSProperties,

  description: {
    fontSize: '14px',
    color: systemColors.light['content-secondary'],
    lineHeight: 1.6,
    margin: 0,
    maxWidth: '640px',
  } as CSSProperties,

  learnMore: {
    color: systemColors.light['content-brand'],
    textDecoration: 'none',
    fontWeight: 500,
    cursor: 'pointer',
  } as CSSProperties,

  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: `${spacing.D}px`,
    padding: `${spacing.C}px 0`,
  } as CSSProperties,

  statusLabel: {
    fontSize: '14px',
    color: systemColors.light['content-primary'],
    minWidth: '80px',
  } as CSSProperties,

  statusValue: {
    fontSize: '14px',
    color: systemColors.light['content-primary'],
    fontWeight: 500,
  } as CSSProperties,

  disabledMessage: {
    fontSize: '13px',
    color: systemColors.light['content-tertiary'],
    fontStyle: 'italic',
    marginTop: `${spacing.B}px`,
  } as CSSProperties,

  enabledContent: {
    marginTop: `${spacing.D}px`,
    display: 'flex',
    flexDirection: 'column',
    gap: `${spacing.D}px`,
  } as CSSProperties,

  fieldRow: {
    display: 'flex',
    alignItems: 'center',
    gap: `${spacing.D}px`,
  } as CSSProperties,

  fieldLabel: {
    fontSize: '14px',
    color: systemColors.light['content-primary'],
    minWidth: '180px',
  } as CSSProperties,

  fieldValue: {
    fontSize: '14px',
    color: systemColors.light['content-secondary'],
  } as CSSProperties,

  buttonGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: `${spacing.C}px`,
  } as CSSProperties,
};

/** Homepage module ordering table */
export const moduleTableStyles = {
  container: {
    padding: `${spacing.F}px 0`,
    borderBottom: `1px solid ${referenceColors.gray['20']}`,
  } as CSSProperties,

  row: {
    display: 'flex',
    alignItems: 'center',
    padding: `${spacing.C}px 0`,
    fontSize: '14px',
    color: systemColors.light['content-primary'],
  } as CSSProperties,

  order: {
    width: '40px',
    color: systemColors.light['content-tertiary'],
  } as CSSProperties,

  name: {
    flex: 1,
    color: systemColors.light['content-primary'],
  } as CSSProperties,

  status: {
    color: systemColors.light['content-primary'],
  } as CSSProperties,
};

/** CSV upload modal */
export const uploadModalStyles = {
  dropzone: {
    border: `2px dashed ${referenceColors.gray['30']}`,
    borderRadius: '8px',
    padding: `${spacing.J}px`,
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'border-color 0.2s ease, background-color 0.2s ease',
    backgroundColor: systemColors.light['background-sunken'],
  } as CSSProperties,

  dropzoneActive: {
    borderColor: systemColors.light['content-brand'],
    backgroundColor: `${systemColors.light['content-brand']}08`,
  } as CSSProperties,

  dropzoneLabel: {
    fontSize: '14px',
    color: systemColors.light['content-secondary'],
    margin: 0,
  } as CSSProperties,

  dropzoneBrowse: {
    color: systemColors.light['content-brand'],
    fontWeight: 500,
    cursor: 'pointer',
  } as CSSProperties,

  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: `${spacing.C}px`,
    padding: `${spacing.C}px ${spacing.D}px`,
    backgroundColor: systemColors.light['background-sunken'],
    borderRadius: '6px',
    marginTop: `${spacing.D}px`,
  } as CSSProperties,

  fileName: {
    flex: 1,
    fontSize: '14px',
    color: systemColors.light['content-primary'],
    fontWeight: 500,
  } as CSSProperties,

  fileSize: {
    fontSize: '13px',
    color: systemColors.light['content-tertiary'],
  } as CSSProperties,

  validationStatus: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: `${spacing.C}px`,
    padding: `${spacing.D}px`,
    borderRadius: '8px',
    marginTop: `${spacing.D}px`,
  } as CSSProperties,

  validationSuccess: {
    backgroundColor: '#E8F5E9',
    border: '1px solid #A5D6A7',
  } as CSSProperties,

  validationError: {
    backgroundColor: '#FFF3F0',
    border: `1px solid ${referenceColors.red?.['30'] ?? '#FFCDD2'}`,
  } as CSSProperties,

  validationTitle: {
    fontSize: '14px',
    fontWeight: 'var(--font-weight-emphasis)',
    margin: 0,
  } as CSSProperties,

  validationMessage: {
    fontSize: '13px',
    color: systemColors.light['content-secondary'],
    margin: 0,
    lineHeight: 1.5,
  } as CSSProperties,

  errorList: {
    margin: `${spacing.B}px 0 0 ${spacing.D}px`,
    padding: 0,
    fontSize: '13px',
    color: systemColors.light['content-secondary'],
    lineHeight: 1.6,
  } as CSSProperties,
};

/** Object picker modal */
export const pickerStyles = {
  searchRow: {
    marginBottom: `${spacing.D}px`,
  } as CSSProperties,

  tabs: {
    marginBottom: `${spacing.D}px`,
  } as CSSProperties,

  listContainer: {
    border: `1px solid ${referenceColors.gray['20']}`,
    borderRadius: '6px',
    overflow: 'hidden',
    maxHeight: '380px',
    overflowY: 'auto' as const,
  } as CSSProperties,

  listHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: `${spacing.C}px ${spacing.D}px`,
    backgroundColor: systemColors.light['background-sunken'],
    borderBottom: `1px solid ${referenceColors.gray['20']}`,
    fontSize: '12px',
    fontWeight: 'var(--font-weight-emphasis)',
    color: systemColors.light['content-secondary'],
    textTransform: 'uppercase' as const,
    letterSpacing: '0.3px',
    gap: `${spacing.C}px`,
  } as CSSProperties,

  listRow: {
    display: 'flex',
    alignItems: 'center',
    padding: `${spacing.C}px ${spacing.D}px`,
    borderBottom: `1px solid ${referenceColors.gray['20']}`,
    gap: `${spacing.C}px`,
    fontSize: '14px',
    color: systemColors.light['content-primary'],
    transition: 'background-color 0.1s ease',
  } as CSSProperties,

  listRowHover: {
    backgroundColor: systemColors.light['background-sunken'],
  } as CSSProperties,

  colName: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  } as CSSProperties,

  colOwner: {
    width: '140px',
    flexShrink: 0,
    color: systemColors.light['content-secondary'],
    fontSize: '13px',
  } as CSSProperties,

  colType: {
    width: '100px',
    flexShrink: 0,
    color: systemColors.light['content-tertiary'],
    fontSize: '13px',
  } as CSSProperties,

  selectionCount: {
    fontSize: '13px',
    color: systemColors.light['content-secondary'],
  } as CSSProperties,
};

/** Admin sidebar custom styles */
export const adminSidebarStyles = {
  header: {
    padding: `${spacing.D}px ${spacing.D}px ${spacing.C}px`,
  } as CSSProperties,

  title: {
    fontSize: '16px',
    fontWeight: 'var(--font-weight-emphasis)',
    color: systemColors.light['content-primary'],
    marginBottom: `${spacing.C}px`,
    fontFamily: FONT_FAMILY,
  } as CSSProperties,

  scopeToggle: {
    display: 'flex',
    backgroundColor: systemColors.light['background-sunken'],
    borderRadius: '6px',
    padding: '2px',
    gap: '2px',
  } as CSSProperties,

  scopeBtn: {
    flex: 1,
    padding: `${spacing.B}px ${spacing.C}px`,
    fontSize: '13px',
    fontWeight: 500,
    color: systemColors.light['content-secondary'],
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: FONT_FAMILY,
  } as CSSProperties,

  scopeBtnActive: {
    backgroundColor: systemColors.light['content-brand'],
    color: '#FFFFFF',
    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
  } as CSSProperties,

  sectionLabel: {
    fontSize: '11px',
    fontWeight: 'var(--font-weight-emphasis)',
    color: systemColors.light['content-tertiary'],
    textTransform: 'uppercase' as const,
    letterSpacing: '0.6px',
    padding: `${spacing.D}px ${spacing.D}px ${spacing.B}px`,
    marginTop: `${spacing.B}px`,
    fontFamily: FONT_FAMILY,
  } as CSSProperties,

  navItem: {
    display: 'block',
    padding: `${spacing.B}px ${spacing.D}px`,
    fontSize: '13px',
    color: referenceColors.gray['70'],
    cursor: 'pointer',
    borderLeft: '3px solid transparent',
    transition: 'all 0.15s ease',
    lineHeight: 1.4,
    textDecoration: 'none',
    fontFamily: FONT_FAMILY,
  } as CSSProperties,

  navItemActive: {
    color: systemColors.light['content-brand'],
    backgroundColor: `${systemColors.light['content-brand']}08`,
    borderLeftColor: systemColors.light['content-brand'],
    fontWeight: 500,
  } as CSSProperties,
};
