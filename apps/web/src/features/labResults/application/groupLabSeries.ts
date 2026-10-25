import type { LabSeries } from '@angia/contracts';
import { findLabCatalogEntry } from './findLabCatalogEntry';
import { LAB_GROUPS, type LabGroupId } from './labCatalog';

export interface LabGroup {
  id: LabGroupId;
  label: string;
  items: { series: LabSeries; note: string | null }[];
}

// Gom chuỗi chỉ số theo nhóm cơ quan (Design LG-01): thứ tự nhóm cố định, bỏ nhóm rỗng,
// trong nhóm giữ thứ tự API (chỉ số có kết quả mới nhất trước, SPEC-021).
export function groupLabSeries(series: LabSeries[]): LabGroup[] {
  const tagged = series.map((item) => ({ series: item, ...findLabCatalogEntry(item.testName) }));
  return LAB_GROUPS.map(({ id, label }) => ({
    id,
    label,
    items: tagged.filter((item) => item.group === id).map(({ series, note }) => ({ series, note })),
  })).filter((group) => group.items.length > 0);
}
