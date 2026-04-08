import React from 'react';
import { chartUi, chartFont } from '../chartPalette';

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
        <tr style={{ backgroundColor: chartUi.gridLine }}>
          {columns.map((col) => (
            <th
              key={col}
              style={{
                padding: '6px 10px',
                textAlign: 'left',
                fontSize: 10,
                fontWeight: 600,
                color: chartUi.labelColor,
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
            style={{ backgroundColor: ri % 2 === 1 ? chartUi.gridLine : 'transparent' }}
          >
            {row.map((cell, ci) => (
              <td
                key={ci}
                style={{
                  padding: '5px 10px',
                  fontSize: 11,
                  color: chartUi.valueColor,
                  borderBottom: `1px solid ${chartUi.axis}`,
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
