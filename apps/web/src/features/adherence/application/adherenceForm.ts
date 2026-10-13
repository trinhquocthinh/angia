import { z } from 'zod';
import type { MedicationPeriods } from './medicationPeriods';
import { normalizeMedicationName } from './normalizeMedicationName';
import type { AdherenceStatus } from './ports';

// SPEC-022 phía form; mốc "sau hẳn giai đoạn trước" và trùng trạng thái do API kiểm (ERR_VALIDATION).
export const adherenceFormSchema = (today: string) =>
  z.object({
    medicationName: z.string().trim().min(1, 'Nhập tên thuốc.').max(200, 'Tên thuốc tối đa 200 ký tự.'),
    status: z.enum(['taking', 'stopped']),
    fromDate: z.iso
      .date('Chọn ngày bắt đầu.')
      .refine((date) => date <= today, 'Ngày bắt đầu không được sau hôm nay.'),
  });
export type AdherenceFormValues = z.infer<ReturnType<typeof adherenceFormSchema>>;

// Thuốc đã có giai đoạn → gợi ý trạng thái ngược với giai đoạn mới nhất; thuốc mới → đang dùng.
export function suggestStatus(name: string, groups: MedicationPeriods[]): AdherenceStatus {
  const group = groups.find((item) => item.key === normalizeMedicationName(name));
  return group?.periods.at(-1)?.status === 'taking' ? 'stopped' : 'taking';
}

export function medicationSuggestions(groups: MedicationPeriods[], currentNames: string[]): string[] {
  const names = new Map<string, string>();
  for (const name of [...groups.map((group) => group.name), ...currentNames]) {
    const key = normalizeMedicationName(name);
    if (key && !names.has(key)) names.set(key, name.trim());
  }
  return [...names.values()].sort((a, b) => a.localeCompare(b, 'vi'));
}
