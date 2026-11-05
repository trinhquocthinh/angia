import type { PrescriptionDiff } from '@angia/contracts';
import { doseSlotLabel } from '@src/features/documents/application/doseSlots';

type Change = Exclude<PrescriptionDiff['changed'][number]['changes'][number], { field: 'lines' }>;
const labels: Record<Change['field'], string> = {
  strength: 'Hàm lượng',
  quantityPerDose: 'Liều mỗi lần',
  doseUnit: 'Đơn vị',
  slots: 'Buổi',
  durationDays: 'Số ngày',
  longTerm: 'Dài hạn',
  externalUse: 'Dùng ngoài',
};

export function prescriptionChangeText(change: Change) {
  const values = (['before', 'after'] as const).map((side) => {
    const value = change[side];
    if (value === null || value === '') return 'Không ghi';
    if (typeof value === 'boolean') return value ? 'Có' : 'Không';
    if (typeof value === 'number') return value.toLocaleString('vi-VN');
    if (Array.isArray(value)) return value.length ? value.map(doseSlotLabel).join(', ') : 'Không ghi';
    return value;
  });
  return { label: labels[change.field], before: values[0]!, after: values[1]! };
}
