import type { Prescription } from './Prescription.js';
import type { PrescriptionDiff, PrescriptionFieldChange } from './PrescriptionDiff.js';
import { normalizeName } from './normalizeName.js';

type Item = Prescription['items'][number];
const fields = [
  'strength',
  'quantityPerDose',
  'doseUnit',
  'slots',
  'durationDays',
  'longTerm',
  'externalUse',
] as const;

function changesBetween(before: Item, after: Item): PrescriptionFieldChange[] {
  return fields.flatMap((field): PrescriptionFieldChange[] => {
    const same =
      field === 'slots'
        ? [...new Set(before.slots)].sort().join(',') === [...new Set(after.slots)].sort().join(',')
        : before[field] === after[field];
    return same ? [] : [{ field, before: before[field], after: after[field] } as PrescriptionFieldChange];
  });
}

function groupItems(items: Item[]): Map<string, Item[]> {
  const groups = new Map<string, Item[]>();
  for (const item of items) {
    const key = normalizeName(item.name);
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }
  return groups;
}

function compareGroup(before: Item[], after: Item[]): PrescriptionDiff['changed'] {
  if (before.length !== after.length) {
    return [{ name: after[0]!.name, changes: [{ field: 'lines', before, after }] }];
  }
  // Ghép dòng giống nhau trước; splice chỉ tác động bản sao danh sách, không sửa đơn đầu vào.
  const remaining = [...before];
  const unmatched = after.filter((item) => {
    const index = remaining.findIndex((old) => changesBetween(old, item).length === 0);
    if (index < 0) return true;
    remaining.splice(index, 1);
    return false;
  });
  return unmatched.map((item, index) => ({
    name: item.name,
    changes: changesBetween(remaining[index]!, item),
  }));
}

// BR-052: chỉ so dữ liệu đã ghi, không sinh nhận định hoặc suy diễn lý do đổi thuốc.
export function diffPrescriptions(previous: Prescription, current: Prescription): PrescriptionDiff {
  const before = groupItems(previous.items);
  const after = groupItems(current.items);
  const result: PrescriptionDiff = { added: [], removed: [], changed: [] };
  for (const [key, items] of after) {
    const old = before.get(key);
    if (old) result.changed.push(...compareGroup(old, items));
    else result.added.push({ name: items[0]!.name, items });
  }
  for (const [key, items] of before) {
    if (!after.has(key)) result.removed.push({ name: items[0]!.name, items });
  }
  return result;
}
