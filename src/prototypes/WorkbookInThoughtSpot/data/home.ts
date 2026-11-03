// Home widgets, from the product home (Vivek's screenshot, 3 Nov), with a workbook added to Recents.
import type { IconName } from '@components/icons';

export interface RecentItem {
  id: string;
  name: string;
  icon: IconName;
  when: string;
}

export const RECENTS: RecentItem[] = [
  { id: 'fy27-revenue-plan', name: 'FY27 Revenue Plan', icon: 'table', when: '2 hours ago' },
  { id: 'onespot', name: 'OneSpot', icon: 'liveboard', when: '5 days ago' },
  { id: 'tsa-icp', name: 'Total Account TSA ICP Score, Total A…', icon: 'answer', when: '5 days ago' },
  { id: 'ott-streaming', name: 'OTT Streaming Trends', icon: 'liveboard', when: '2 months ago' },
  { id: 'sales-forecast', name: 'Sales Forecast Liveboard', icon: 'liveboard', when: '2 months ago' },
];

export interface WatchItem {
  id: string;
  name: string;
  comparison: string;
  value: string;
  change?: string;
}

export const WATCHLIST: WatchItem[] = [
  { id: 'qtd-acv', name: 'QTD Booked ACV', comparison: 'Comparison point unavailable', value: '0' },
  { id: 'enrollments', name: 'Enrollments This Month', comparison: 'MoM', value: '186', change: '92.35%' },
  { id: 'mau', name: 'Total MAU (Sage + Ask Sage)', comparison: 'MoM', value: '69', change: '64.80%' },
];
