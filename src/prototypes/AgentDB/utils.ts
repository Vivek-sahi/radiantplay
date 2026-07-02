/**
 * Agent DB — formatting + capacity helpers
 */

import { capacity } from './data';
import type { DataModel, Frequency, Schedule, WindowMonths } from './types';

/** 256 → "256 MB"; 35020 → "34.2 GB" */
export function formatSizeMB(mb: number): string {
  if (mb <= 0) return '0 MB';
  if (mb < 1024) return `${Math.round(mb)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}

export function formatGB(gb: number): string {
  return Number.isInteger(gb) ? `${gb} GB` : `${gb.toFixed(1)} GB`;
}

/** 1_500_000 → "1.5 Million"; 84_200 → "84,200" */
export function formatRowsShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} Million`;
  return n.toLocaleString('en-US');
}

/** 120983 → "120,983" */
export function formatRowsFull(n: number): string {
  return n.toLocaleString('en-US');
}

const FREQ_LABEL: Record<Frequency, string> = {
  hourly: 'Hourly',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

export function frequencyLabel(f: Frequency): string {
  return FREQ_LABEL[f];
}

/** { daily, 9, 0 } → "9:00 AM" */
export function timeLabel(hour: number, minute: number): string {
  const period = hour < 12 ? 'AM' : 'PM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${String(minute).padStart(2, '0')} ${period}`;
}

/** { daily, 9, 0 } → "Daily, 9:00 AM" */
export function scheduleLabel(s: Schedule): string {
  return `${FREQ_LABEL[s.frequency]}, ${timeLabel(s.hour, s.minute)}`;
}

export function windowMonthsLabel(m: WindowMonths): string {
  return `Last ${m} months`;
}

// ── Capacity ─────────────────────────────────────────────────────────────────
export interface CapacitySummary {
  purchasedGB: number;
  usedGB: number;
  availableGB: number;
  usedPct: number; // 0-100
}

export function capacitySummary(models: DataModel[]): CapacitySummary {
  const usedMB = models.reduce(
    (sum, m) => sum + (m.cache && m.cache.status !== 'purged' ? m.cache.cacheSizeMB : 0),
    0,
  );
  const usedGB = usedMB / 1024;
  const purchasedGB = capacity.purchasedGB;
  const availableGB = Math.max(0, purchasedGB - usedGB);
  const usedPct = Math.min(100, (usedGB / purchasedGB) * 100);
  return { purchasedGB, usedGB, availableGB, usedPct };
}

export function isCacheEnabled(m: DataModel): boolean {
  return !!m.cache; // config exists (includes 'purged' — config retained)
}
