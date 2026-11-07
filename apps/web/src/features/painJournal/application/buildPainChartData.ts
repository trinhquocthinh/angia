import type { PainEntry } from '@angia/contracts';
import { vietnamToday } from '@src/features/measurements/application/seriesRange';

export type PainChartPoint = { value: [number, number | null]; note: string | null };

export function buildPainChartData(entries: PainEntry[], range: { from: string; to: string }) {
  const visible = entries
    .filter((entry) => {
      const day = vietnamToday(new Date(entry.recordedAt));
      return day >= range.from && day <= range.to;
    })
    .toSorted((a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt));
  const points: PainChartPoint[] = [];
  let previous: { at: number; day: number } | undefined;
  for (const entry of visible) {
    const at = Date.parse(entry.recordedAt);
    const day = Date.parse(vietnamToday(new Date(at)));
    if (previous && day - previous.day > 7 * 86_400_000)
      points.push({ value: [(previous.at + at) / 2, null], note: null });
    points.push({ value: [at, entry.level], note: entry.note });
    previous = { at, day };
  }
  return { entries: visible, points };
}
