import React, { useMemo } from 'react';
import { useRadiantLook } from '../../context/RadiantLookContext';
import styles from './Pagination.module.css';

export interface PaginationNumbersProps {
  /**
   * Current page (1-indexed)
   */
  currentPage: number;
  /**
   * Total number of pages
   */
  totalPages: number;
  /**
   * Page change handler
   */
  onPageChange: (page: number) => void;
  /**
   * Number of sibling pages to show
   * @default 1
   */
  siblingCount?: number;
  /**
   * Show first/last page navigation buttons
   * @default false
   */
  showFirstLast?: boolean;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Arrow icons
 */
const ChevronLeftIcon: React.FC = () => (
  <svg className={styles.navIcon} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronRightIcon: React.FC = () => (
  <svg className={styles.navIcon} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronsLeftIcon: React.FC = () => (
  <svg className={styles.navIcon} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 12L3 8L7 4M13 12L9 8L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronsRightIcon: React.FC = () => (
  <svg className={styles.navIcon} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 4L13 8L9 12M3 4L7 8L3 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Generate page numbers with ellipsis
 */
function getPageNumbers(current: number, total: number, siblings: number): (number | 'ellipsis')[] {
  const pages: (number | 'ellipsis')[] = [];
  
  // Always show first page
  pages.push(1);
  
  // Calculate range around current page
  const leftSibling = Math.max(2, current - siblings);
  const rightSibling = Math.min(total - 1, current + siblings);
  
  // Add left ellipsis if needed
  if (leftSibling > 2) {
    pages.push('ellipsis');
  }
  
  // Add pages in range
  for (let i = leftSibling; i <= rightSibling; i++) {
    if (i !== 1 && i !== total) {
      pages.push(i);
    }
  }
  
  // Add right ellipsis if needed
  if (rightSibling < total - 1) {
    pages.push('ellipsis');
  }
  
  // Always show last page if more than 1 page
  if (total > 1) {
    pages.push(total);
  }
  
  return pages;
}

/**
 * PaginationNumbers Component
 * 
 * Classic pagination with page numbers and navigation arrows.
 */
const PaginationNumbers: React.FC<PaginationNumbersProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  showFirstLast = false,
  className = '',
}) => {
  const pageNumbers = useMemo(
    () => getPageNumbers(currentPage, totalPages, siblingCount),
    [currentPage, totalPages, siblingCount]
  );

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <nav className={`${styles.pagination} ${className}`} aria-label="Pagination">
      {showFirstLast && (
        <button
          type="button"
          className={styles.navButton}
          onClick={() => onPageChange(1)}
          disabled={!canGoPrev}
          aria-label="First page"
        >
          <ChevronsLeftIcon />
        </button>
      )}
      
      <button
        type="button"
        className={styles.navButton}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!canGoPrev}
        aria-label="Previous page"
      >
        <ChevronLeftIcon />
      </button>

      {pageNumbers.map((page, index) => {
        if (page === 'ellipsis') {
          return (
            <span key={`ellipsis-${index}`} className={styles.ellipsis}>
              ...
            </span>
          );
        }
        
        const isActive = page === currentPage;
        return (
          <button
            key={page}
            type="button"
            className={`${styles.pageButton} ${isActive ? styles.pageButtonActive : ''}`}
            onClick={() => onPageChange(page)}
            aria-current={isActive ? 'page' : undefined}
            aria-label={`Page ${page}`}
          >
            {page}
          </button>
        );
      })}

      <button
        type="button"
        className={styles.navButton}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!canGoNext}
        aria-label="Next page"
      >
        <ChevronRightIcon />
      </button>

      {showFirstLast && (
        <button
          type="button"
          className={styles.navButton}
          onClick={() => onPageChange(totalPages)}
          disabled={!canGoNext}
          aria-label="Last page"
        >
          <ChevronsRightIcon />
        </button>
      )}
    </nav>
  );
};

export interface PaginationDotsProps {
  /**
   * Current page (1-indexed)
   */
  currentPage: number;
  /**
   * Total number of pages
   */
  totalPages: number;
  /**
   * Page change handler
   */
  onPageChange: (page: number) => void;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * PaginationDots Component
 * 
 * Dot-based pagination for carousels and slideshows.
 */
const PaginationDots: React.FC<PaginationDotsProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}) => {
  return (
    <div className={`${styles.dots} ${className}`} role="tablist" aria-label="Pagination">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
        const isActive = page === currentPage;
        return (
          <button
            key={page}
            type="button"
            className={`${styles.dot} ${isActive ? styles.dotActive : ''}`}
            onClick={() => onPageChange(page)}
            role="tab"
            aria-selected={isActive}
            aria-label={`Page ${page}`}
          />
        );
      })}
    </div>
  );
};

export interface PaginationRangeProps {
  /**
   * Current page (1-indexed)
   */
  currentPage: number;
  /**
   * Total number of pages
   */
  totalPages: number;
  /**
   * Items per page
   */
  itemsPerPage: number;
  /**
   * Total number of items
   */
  totalItems: number;
  /**
   * Page change handler
   */
  onPageChange: (page: number) => void;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * PaginationRange Component
 * 
 * Shows "Showing X-Y of Z items" with navigation.
 */
const PaginationRange: React.FC<PaginationRangeProps> = ({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  className = '',
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;
  // Radiant 3.0 look: "Showing 1-20 of 500 results"
  const isRadiant3 = useRadiantLook() === 'radiant-3';

  return (
    <div className={`${styles.range} ${className}`}>
      <span className={styles.rangeText}>
        Showing <span className={styles.rangeStrong}>{startItem}-{endItem}</span> of{' '}
        <span className={styles.rangeStrong}>{totalItems}</span>
        {isRadiant3 && ' results'}
      </span>
      
      <button
        type="button"
        className={styles.navButton}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!canGoPrev}
        aria-label="Previous page"
      >
        <ChevronLeftIcon />
      </button>
      
      <button
        type="button"
        className={styles.navButton}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!canGoNext}
        aria-label="Next page"
      >
        <ChevronRightIcon />
      </button>
    </div>
  );
};

interface PaginationComposition {
  Numbers: typeof PaginationNumbers;
  Dots: typeof PaginationDots;
  Range: typeof PaginationRange;
}

/**
 * Pagination Component
 * 
 * A compound component for page navigation.
 * 
 * **Variants:**
 * - `Numbers` - Classic numbered pagination with arrows
 * - `Dots` - Dot indicators for carousels
 * - `Range` - "Showing X-Y of Z" with arrows
 * 
 * @example
 * ```tsx
 * // Numbered pagination
 * <Pagination.Numbers
 *   currentPage={page}
 *   totalPages={10}
 *   onPageChange={setPage}
 * />
 * 
 * // Dot pagination
 * <Pagination.Dots
 *   currentPage={slide}
 *   totalPages={5}
 *   onPageChange={setSlide}
 * />
 * 
 * // Range display
 * <Pagination.Range
 *   currentPage={page}
 *   totalPages={10}
 *   itemsPerPage={20}
 *   totalItems={195}
 *   onPageChange={setPage}
 * />
 * ```
 */
export const Pagination: React.FC & PaginationComposition = () => null;

Pagination.Numbers = PaginationNumbers;
Pagination.Dots = PaginationDots;
Pagination.Range = PaginationRange;

export default Pagination;
