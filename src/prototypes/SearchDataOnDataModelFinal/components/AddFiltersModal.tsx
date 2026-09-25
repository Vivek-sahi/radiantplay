import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { SearchInput } from '@components/SearchInput';
import { Checkbox } from '@components/Checkbox';
import { Toggle } from '@components/Toggle';
import { Avatar } from '@components/Avatar';
import { Button } from '@components/Button';
import { Icon } from '@components/icons';

// "Add filters" modal (2026-09-25, Komal: "recreate this pixel perfect") —
// traced from three reference screenshots of the real product. Custom modal
// shell rather than RdModal: the reference is wider than RdModal's largest
// preset (M4, 1350px) and RdModal explicitly never gives M4 a footer, but
// this needs both the extra width and a Cancel/Add footer.
const AUTHORS = [
  'vineet.sharma@thoughtspot.com',
  'mayank.sharma@thoughtspot.com',
  'srikrishna.vishnubhatla@thoughtspot.com',
  'sourav.kumar@thoughtspot.com',
];

const linkStyle: React.CSSProperties = {
  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
  color: 'var(--rd-sys-color-content-brand, #2770EF)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)',
};

const TreeRow: React.FC<{
  label: string; checked: boolean; onToggle: () => void;
  indent?: boolean; hasChildren?: boolean; expanded?: boolean; onExpand?: () => void;
}> = ({ label, checked, onToggle, indent, hasChildren, expanded, onExpand }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', padding: '10px var(--spacing-1)', paddingLeft: indent ? 40 : 4 }}>
    {hasChildren ? (
      <button type="button" onClick={onExpand} aria-label={expanded ? `Collapse ${label}` : `Expand ${label}`}
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', color: 'var(--rd-sys-color-content-primary)', transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 120ms' }}>
        <Icon name="chevron-down" size="s" />
      </button>
    ) : <span style={{ width: 16, flexShrink: 0 }} />}
    <Checkbox checked={checked} onChange={onToggle} showLabel={false} />
    <span style={{ fontSize: 15, fontWeight: hasChildren ? 700 : 400, color: 'var(--rd-sys-color-content-primary)' }}>{label}</span>
  </div>
);

const AuthorRow: React.FC<{ email: string; checked: boolean; onToggle: () => void }> = ({ email, checked, onToggle }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', padding: 'var(--spacing-2) var(--spacing-1)' }}>
    <Checkbox checked={checked} onChange={onToggle} showLabel={false} />
    <Avatar name={email} size="s" />
    <span style={{ fontSize: 15, color: 'var(--rd-sys-color-content-primary)' }}>{email}</span>
  </div>
);

const EmptyState: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-4)' }}>
    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--rd-sys-color-background-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon name="exclamation-point-circle" size="m" color="var(--rd-sys-color-content-secondary)" />
    </div>
    <div>
      <div style={{ fontSize: 15, fontWeight: 'var(--font-weight-semibold)', color: 'var(--rd-sys-color-content-primary)' }}>{title}</div>
      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--rd-sys-color-content-secondary)', lineHeight: 1.45, maxWidth: 320 }}>{description}</div>
    </div>
  </div>
);

const FilterSection: React.FC<{
  id: string;
  title: string;
  searchValue: string;
  onSearchChange: (v: string) => void;
  countLabel: string;
  onSelectAll: () => void;
  onClear: () => void;
  showSelected: boolean;
  onShowSelectedChange: (v: boolean) => void;
  last?: boolean;
  children: React.ReactNode;
}> = ({ id, title, searchValue, onSearchChange, countLabel, onSelectAll, onClear, showSelected, onShowSelectedChange, last, children }) => (
  <div id={id} style={{ marginBottom: last ? 0 : 48 }}>
    <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--rd-sys-color-content-primary)', marginBottom: 'var(--spacing-4)' }}>{title}</div>
    <SearchInput placeholder="Search" value={searchValue} onChange={e => onSearchChange(e.target.value)} />
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: 'var(--spacing-4) 0 var(--spacing-2)' }}>
      <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--rd-sys-color-content-primary)' }}>{countLabel}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
        <button type="button" onClick={onSelectAll} style={linkStyle}>Select all</button>
        <span style={{ width: 1, height: 14, background: 'var(--rd-sys-color-border-divider)' }} />
        <button type="button" onClick={onClear} style={linkStyle}>Clear</button>
      </span>
    </div>
    <div style={{ border: '1px solid var(--rd-sys-color-border-divider)', borderRadius: 'var(--radius-md)' }}>
      <div style={{ height: 507, overflowY: 'auto', padding: 'var(--spacing-2) var(--spacing-4)' }}>
        {children}
      </div>
      <div style={{ borderTop: '1px solid var(--rd-sys-color-border-divider)', display: 'flex', alignItems: 'center', gap: 10, padding: 'var(--spacing-3) var(--spacing-4)' }}>
        <Toggle checked={showSelected} onChange={onShowSelectedChange} showLabel={false} />
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--rd-sys-color-content-primary)' }}>Show selected</span>
      </div>
    </div>
  </div>
);

export interface AddFiltersModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onAdd: () => void;
}

export const AddFiltersModal: React.FC<AddFiltersModalProps> = ({ isOpen, onCancel, onAdd }) => {
  const [dbExpanded, setDbExpanded] = useState(true);
  const [dbChecked, setDbChecked] = useState<Set<string>>(new Set());
  const [authorChecked, setAuthorChecked] = useState<Set<string>>(new Set());
  const [dbSearch, setDbSearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [authorSearch, setAuthorSearch] = useState('');
  const [showSelectedDb, setShowSelectedDb] = useState(false);
  const [showSelectedTags, setShowSelectedTags] = useState(false);
  const [showSelectedAuthors, setShowSelectedAuthors] = useState(false);

  if (!isOpen) return null;

  const toggleDb = (key: string) => setDbChecked(prev => {
    const n = new Set(prev);
    n.has(key) ? n.delete(key) : n.add(key);
    return n;
  });
  const toggleAuthor = (email: string) => setAuthorChecked(prev => {
    const n = new Set(prev);
    n.has(email) ? n.delete(email) : n.add(email);
    return n;
  });

  return createPortal(
    <div
      // Marks this portaled overlay (rendered to document.body, outside
      // whatever panel its trigger button lives in) as "inside" for other
      // components' own outside-click-to-close listeners — see
      // TableColumnSidePanel's check, which otherwise treats any click here
      // as an outside click and closes the whole Data Browser panel under it.
      data-portal-overlay=""
      style={{ position: 'fixed', inset: 0, zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(25,35,49,0.45)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div style={{ width: 'min(1600px, 94vw)', height: '90vh', background: 'var(--rd-sys-color-background-base, #fff)', borderRadius: 'var(--radius-lg)', boxShadow: '0 24px 64px rgba(25,35,49,0.22), 0 4px 16px rgba(25,35,49,0.10)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ height: 68, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 var(--spacing-8)', borderBottom: '1px solid var(--rd-sys-color-border-divider)' }}>
          <span style={{ fontSize: 24, fontWeight: 'var(--font-weight-semibold)', color: 'var(--rd-sys-color-content-primary)' }}>Add filters</span>
        </div>
        {/* Body */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
          {/* Left nav — a single scroll-spy anchor, matching the reference (always highlighted, since there's only ever one section it can point to) */}
          <div style={{ width: 340, flexShrink: 0, borderRight: '1px solid var(--rd-sys-color-border-divider)', padding: 'var(--spacing-6) var(--spacing-8)' }}>
            <a
              href="#add-filters-databases"
              onClick={e => { e.preventDefault(); document.getElementById('add-filters-databases')?.scrollIntoView({ behavior: 'smooth' }); }}
              style={{ fontSize: 15, fontWeight: 'var(--font-weight-medium)', color: 'var(--rd-sys-color-content-brand, #2770EF)', textDecoration: 'none' }}
            >
              Filter by databases and schemas
            </a>
          </div>
          {/* Right — scrollable content */}
          <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: 'var(--spacing-6) var(--spacing-8)' }}>
            <FilterSection
              id="add-filters-databases"
              title="Filter by databases and schemas"
              searchValue={dbSearch}
              onSearchChange={setDbSearch}
              countLabel={`Database and schema (${dbChecked.size})`}
              onSelectAll={() => setDbChecked(new Set(['FRANCOIS', 'AIRBNB']))}
              onClear={() => setDbChecked(new Set())}
              showSelected={showSelectedDb}
              onShowSelectedChange={setShowSelectedDb}
            >
              <TreeRow label="FRANCOIS" checked={dbChecked.has('FRANCOIS')} onToggle={() => toggleDb('FRANCOIS')} hasChildren expanded={dbExpanded} onExpand={() => setDbExpanded(v => !v)} />
              {dbExpanded && (
                <TreeRow label="AIRBNB" checked={dbChecked.has('AIRBNB')} onToggle={() => toggleDb('AIRBNB')} indent />
              )}
            </FilterSection>

            <FilterSection
              id="add-filters-tags"
              title="Filter by tags"
              searchValue={tagSearch}
              onSearchChange={setTagSearch}
              countLabel="Tags (0)"
              onSelectAll={() => {}}
              onClear={() => {}}
              showSelected={showSelectedTags}
              onShowSelectedChange={setShowSelectedTags}
            >
              <EmptyState title="No tags to display" description="When your admin creates tags they'll display here." />
            </FilterSection>

            <FilterSection
              id="add-filters-authors"
              title="Filter by authors"
              searchValue={authorSearch}
              onSearchChange={setAuthorSearch}
              countLabel={`Authors (${authorChecked.size})`}
              onSelectAll={() => setAuthorChecked(new Set(AUTHORS))}
              onClear={() => setAuthorChecked(new Set())}
              showSelected={showSelectedAuthors}
              onShowSelectedChange={setShowSelectedAuthors}
              last
            >
              {AUTHORS.map(email => (
                <AuthorRow key={email} email={email} checked={authorChecked.has(email)} onToggle={() => toggleAuthor(email)} />
              ))}
            </FilterSection>
          </div>
        </div>
        {/* Footer */}
        <div style={{ height: 72, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--spacing-3)', padding: '0 var(--spacing-8)', borderTop: '1px solid var(--rd-sys-color-border-divider)', background: 'var(--rd-sys-color-background-sunken)' }}>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" onClick={onAdd}>Add</Button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default AddFiltersModal;
