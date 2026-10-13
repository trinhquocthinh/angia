import type { DocumentEntry } from '@angia/contracts';

interface EntryMonth {
  key: string;
  label: string;
  items: DocumentEntry[];
}

// Dòng thời gian "Tháng MM/YYYY" theo Stitch 10424d70; API đã sắp mới nhất trước nên chỉ gom liền kề.
export function groupEntriesByMonth(items: readonly DocumentEntry[]): EntryMonth[] {
  const months: EntryMonth[] = [];
  for (const item of items) {
    const key = item.entryDate.slice(0, 7);
    const last = months[months.length - 1];
    if (last?.key === key) last.items.push(item);
    else months.push({ key, label: `Tháng ${key.slice(5)}/${key.slice(0, 4)}`, items: [item] });
  }
  return months;
}
