import { z } from 'zod';
import type { CreateSelfReportedCourseRequest } from '@angia/contracts';

const quantity = (value: string) => Number(value.trim().replace(',', '.'));
export const selfReportedCourseFormSchema = z.object({
  name: z.string().trim().min(1, 'Nhập tên thuốc.').max(200, 'Tên thuốc tối đa 200 ký tự.'),
  strength: z.string().trim().max(100, 'Hàm lượng tối đa 100 ký tự.'),
  quantityPerDose: z
    .string()
    .refine(
      (text) => /^\d+([.,]\d+)?$/.test(text.trim()) && quantity(text) > 0 && quantity(text) <= 1000,
      'Nhập liều lớn hơn 0, tối đa 1000; ví dụ 1 hoặc 0,5.',
    ),
  doseUnit: z.string().trim().min(1, 'Nhập đơn vị dùng, ví dụ viên hoặc ml.').max(50),
  slots: z.array(z.enum(['morning', 'noon', 'afternoon', 'evening'])).min(1, 'Chọn ít nhất một buổi dùng.'),
  startDate: z.iso.date('Nhập ngày bắt đầu hợp lệ.'),
});
export type SelfReportedCourseFormValues = z.infer<typeof selfReportedCourseFormSchema>;

export function toSelfReportedCourseRequest(
  values: SelfReportedCourseFormValues,
): CreateSelfReportedCourseRequest {
  return {
    name: values.name.trim(),
    strength: values.strength.trim() || null,
    quantityPerDose: quantity(values.quantityPerDose),
    doseUnit: values.doseUnit.trim(),
    slots: [...values.slots],
    startDate: values.startDate,
  };
}
