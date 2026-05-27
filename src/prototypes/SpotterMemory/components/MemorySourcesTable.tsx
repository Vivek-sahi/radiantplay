import React, { useState } from 'react';
import { Table, TableColumn } from '../../../components/Table';
import { Avatar } from '../../../components/Avatar';
import { Icon } from '../../../components/icons';
import { tableStyles as styles } from '../styles';
import { Liveboard, getRelativeTime, paginationData } from '../data/mockData';
import { referenceColors } from '../../../tokens/colors';

interface MemorySourcesTableProps {
  data: Liveboard[];
  onRowClick?: (liveboard: Liveboard) => void;
}

/**
 * MemorySourcesTable Component
 * 
 * Data table for displaying memory sources (liveboards) with custom column renderers.
 */
export const MemorySourcesTable: React.FC<MemorySourcesTableProps> = ({
  data,
  onRowClick,
}) => {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(paginationData.currentPage);

  // Calculate pagination
  const startItem = (currentPage - 1) * paginationData.itemsPerPage + 1;
  const endItem = Math.min(currentPage * paginationData.itemsPerPage, paginationData.totalItems);
  const totalPages = Math.ceil(paginationData.totalItems / paginationData.itemsPerPage);

  // Custom column definitions
  const columns: TableColumn<Liveboard>[] = [
    {
      key: 'name',
      label: 'Liveboard name',
      minWidth: '180px',
      render: (value) => (
        <span style={styles.linkCell}>{String(value)}</span>
      ),
    },
    {
      key: 'author',
      label: 'Liveboard author',
      minWidth: '140px',
      render: (value) => {
        const author = value as Liveboard['author'];
        return (
          <div style={styles.authorCell}>
            <Avatar name={author.name} src={author.avatar} size="xs" />
            <span style={{ 
              color: referenceColors.gray['70'],
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100px',
            }}>
              {author.name.length > 10 ? `${author.name.substring(0, 10)}...` : author.name}
            </span>
          </div>
        );
      },
    },
    {
      key: 'modelsWithMemory',
      label: 'Models with added memory',
      minWidth: '180px',
      render: (value) => {
        const models = value as string[];
        const displayModels = models.slice(0, 2);
        const hasMore = models.length > 2 || models.some(m => m.startsWith('+'));
        
        return (
          <div style={styles.modelsCell}>
            <span style={{ color: referenceColors.gray['70'] }}>
              {displayModels.filter(m => !m.startsWith('+')).join(', ')}
            </span>
            {hasMore && (
              <span style={styles.moreLink}>
                {models.find(m => m.startsWith('+')) || `+${models.length - 2}`}
                {' '}More
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'lastAdded',
      label: 'Last added',
      minWidth: '120px',
      sortable: true,
      render: (value) => {
        const date = value as Date;
        return (
          <span style={{ color: referenceColors.gray['70'] }}>
            {getRelativeTime(date)}
          </span>
        );
      },
    },
    {
      key: 'lastAddedBy',
      label: 'Last added by',
      minWidth: '140px',
      render: (value) => {
        const author = value as Liveboard['lastAddedBy'];
        return (
          <div style={styles.authorCell}>
            <Avatar name={author.name} src={author.avatar} size="xs" />
            <span style={{ 
              color: referenceColors.gray['70'],
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100px',
            }}>
              {author.name.length > 10 ? `${author.name.substring(0, 10)}...` : author.name}
            </span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: '',
      width: '48px',
      minWidth: '48px',
      render: () => (
        <div style={styles.actionsCell}>
          <button
            type="button"
            aria-label="Row actions"
            style={styles.moreButton}
            onClick={(e) => {
              e.stopPropagation();
              // Handle more actions menu
            }}
          >
            <Icon name="more" size="m" />
          </button>
        </div>
      ),
    },
  ];

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div style={styles.container}>
      <Table
        columns={columns as unknown as import('../../../components/Table/Table').TableColumn<Record<string, unknown>>[]}
        data={data as unknown as Record<string, unknown>[]}
        rowKey="id"
        selectable
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        onRowClick={(row) => onRowClick?.(row as unknown as Liveboard)}
        hoverable
      />
      
      {/* Custom Pagination */}
      <div style={styles.pagination}>
        <span style={styles.paginationText}>
          {startItem}-{endItem} of {paginationData.totalItems}
        </span>
        {currentPage < totalPages && (
          <span 
            style={styles.paginationLink}
            onClick={handleNextPage}
          >
            Next
            <Icon name="chevron-right" size="s" />
          </span>
        )}
      </div>
    </div>
  );
};

export default MemorySourcesTable;
