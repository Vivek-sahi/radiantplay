import React, { useState, useMemo, useCallback } from 'react';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { SearchInput } from '../../../components/SearchInput';
import { Checkbox } from '../../../components/Checkbox';
import { Tabs } from '../../../components/Tabs';
import { pickerStyles as s } from '../styles';
import { mockLiveboards, mockAnswers, type LiveboardItem } from '../data/mockData';
import { systemColors } from '../../../tokens/colors';

interface ObjectPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedIds: string[]) => void;
  initialSelectedIds?: string[];
}

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'liveboards', label: 'Liveboards' },
  { id: 'answers', label: 'Answers' },
];

export const ObjectPickerModal: React.FC<ObjectPickerModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialSelectedIds = [],
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds));

  const allItems = useMemo(() => [...mockLiveboards, ...mockAnswers], []);

  const filteredItems = useMemo(() => {
    let items: LiveboardItem[];
    switch (activeTab) {
      case 'liveboards':
        items = mockLiveboards;
        break;
      case 'answers':
        items = mockAnswers;
        break;
      default:
        items = allItems;
    }
    if (!searchValue.trim()) return items;
    const q = searchValue.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) || item.owner.toLowerCase().includes(q),
    );
  }, [activeTab, searchValue, allItems]);

  const allSelected = filteredItems.length > 0 && filteredItems.every((i) => selectedIds.has(i.id));
  const someSelected = filteredItems.some((i) => selectedIds.has(i.id)) && !allSelected;

  const handleToggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        filteredItems.forEach((i) => next.delete(i.id));
      } else {
        filteredItems.forEach((i) => next.add(i.id));
      }
      return next;
    });
  }, [allSelected, filteredItems]);

  const handleConfirm = useCallback(() => {
    onConfirm(Array.from(selectedIds));
    setSearchValue('');
    setActiveTab('all');
  }, [selectedIds, onConfirm]);

  const handleClose = useCallback(() => {
    setSearchValue('');
    setActiveTab('all');
    setSelectedIds(new Set(initialSelectedIds));
    onClose();
  }, [onClose, initialSelectedIds]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Pick Liveboards & Answers to translate"
      size="M2"
      showCloseButton
      footer={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span style={s.selectionCount}>
            {selectedIds.size} {selectedIds.size === 1 ? 'item' : 'items'} selected
          </span>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirm} disabled={selectedIds.size === 0}>
              Confirm & download CSV
            </Button>
          </div>
        </div>
      }
    >
      {/* Search */}
      <div style={s.searchRow}>
        <SearchInput
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search Liveboards and Answers"
        />
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* List */}
      <div style={s.listContainer}>
        {/* Header row */}
        <div style={s.listHeader}>
          <div style={{ width: '24px', flexShrink: 0 }}>
            <Checkbox
              checked={allSelected}
              indeterminate={someSelected}
              onChange={handleSelectAll}
            />
          </div>
          <div style={{ ...s.colName, fontWeight: 'var(--font-weight-emphasis)' }}>Name</div>
          <div style={{ ...s.colOwner, fontWeight: 'var(--font-weight-emphasis)' }}>Owner</div>
          <div style={{ ...s.colType, fontWeight: 'var(--font-weight-emphasis)' }}>Type</div>
        </div>

        {/* Data rows */}
        {filteredItems.length === 0 ? (
          <div
            style={{
              padding: '32px',
              textAlign: 'center',
              color: systemColors.light['content-tertiary'],
              fontSize: '14px',
            }}
          >
            No results found
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              style={s.listRow}
              onClick={() => handleToggle(item.id)}
            >
              <div style={{ width: '24px', flexShrink: 0 }}>
                <Checkbox
                  checked={selectedIds.has(item.id)}
                  onChange={() => handleToggle(item.id)}
                />
              </div>
              <div style={s.colName}>{item.name}</div>
              <div style={s.colOwner}>{item.owner}</div>
              <div style={s.colType}>
                {item.type === 'liveboard' ? 'Liveboard' : 'Answer'}
              </div>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
};

export default ObjectPickerModal;
