import React from 'react';
import styles from './MarkdownTable.module.css';

export interface MarkdownTableColumn {
  key: string;
  label: string;
  render?: (value: unknown) => React.ReactNode;
}

export type MarkdownTableVariant = 'lines' | 'cells' | 'grid' | 'zebra';
export type ZebraHeader = 'darker' | 'lighter';

export interface MarkdownTableProps {
  columns: MarkdownTableColumn[];
  rows: Record<string, unknown>[];
  /** Visual option — see the variant list below. */
  variant?: MarkdownTableVariant;
  /** Draw vertical rules. Applies to the 'grid' variant only. */
  verticalLines?: boolean;
  /** Tint body rows on hover. Applies to the 'grid' variant only. */
  rowHover?: boolean;
  /** Draw vertical rules over the banding. Applies to the 'zebra' variant only. */
  zebraVerticalLines?: boolean;
  /** Draw horizontal rules over the banding. Applies to the 'zebra' variant only. */
  zebraHorizontalLines?: boolean;
  /** The header's shade — it's row 1 of the banding, so the body alternates from
   *  it. Applies to the 'zebra' variant only. */
  zebraHeader?: ZebraHeader;
}

/**
 * Markdown table with four visual options:
 *  - 'lines'  — borderless, th/td share a bottom hairline (Option 1)
 *  - 'cells'  — filled tiles with 4px radius separated by 2px gaps (Option 2)
 *  - 'grid'   — bordered, filled header, rounded outer edge (Option 3). Horizontal
 *               rules always; pass verticalLines to add the vertical ones and
 *               rowHover to tint body rows on hover.
 *  - 'zebra'  — no lines; rows alternate filled / unfilled (Option 4). Overlay
 *               rules with zebraVerticalLines / zebraHorizontalLines, and set the
 *               header's shade with zebraHeader (the body alternates from it).
 */
export const MarkdownTable: React.FC<MarkdownTableProps> = ({
  columns,
  rows,
  variant = 'lines',
  verticalLines = false,
  rowHover = false,
  zebraVerticalLines = false,
  zebraHorizontalLines = false,
  zebraHeader = 'lighter',
}) => (
  // Wrapper carries the block margins + (for cells) the rounded clip — a <table>
  // element doesn't honour overflow:hidden, so the clip must live on a block box.
  <div className={styles.wrap} data-variant={variant}>
    <table
      className={styles.table}
      data-variant={variant}
      data-vertical-lines={verticalLines ? 'true' : undefined}
      data-row-hover={rowHover ? 'true' : undefined}
      data-zebra-vlines={zebraVerticalLines ? 'true' : undefined}
      data-zebra-hlines={zebraHorizontalLines ? 'true' : undefined}
      data-zebra-header={zebraHeader}
    >
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key} className={styles.th}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {columns.map((col) => (
              <td key={col.key} className={styles.td}>
                {col.render ? col.render(row[col.key]) : String(row[col.key] ?? '')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default MarkdownTable;
