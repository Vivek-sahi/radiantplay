import React from 'react';
import { chartFont } from '../chartPalette';
import { compVar, sysVar } from '@tokens/colors';

const columns = ['Region', 'Sales', 'Growth', 'Share'];
const rows = [
  ['North America', '$1.2M', '+14%', '38%'],
  ['Europe',        '$0.8M', '+9%',  '26%'],
  ['Asia Pacific',  '$0.6M', '+22%', '20%'],
  ['Latin America', '$0.3M', '+6%',  '10%'],
  ['Middle East',   '$0.2M', '+3%',  '6%' ],
];

interface Props { width?: number; height?: number; }

export const TableChart: React.FC<Props> = ({ height }) => (
  <div style={{ width: '100%', height: height ?? 180, overflow: 'auto', fontFamily: chartFont }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
      <thead>
        <tr style={{ backgroundColor: compVar('chart-table-striped-row') }}>
          {columns.map((col) => (
            <th
              key={col}
              style={{
                padding: '6px 10px',
                textAlign: 'left',
                fontSize: 10,
                fontWeight: 'var(--font-weight-emphasis)',
                color: compVar('chart-axis-label'),
                whiteSpace: 'nowrap',
              }}
            >
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr
            key={ri}
            style={{ backgroundColor: ri % 2 === 1 ? compVar('chart-table-striped-row') : 'transparent' }}
          >
            {row.map((cell, ci) => (
              <td
                key={ci}
                style={{
                  padding: '5px 10px',
                  fontSize: 11,
                  color: compVar('chart-label'),
                  borderBottom: `1px solid ${sysVar('border-divider')}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
