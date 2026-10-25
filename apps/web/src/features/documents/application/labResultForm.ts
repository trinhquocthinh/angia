import { z } from 'zod';
import type { LabResultApproval, LabResultPayload } from './reviewPorts';

// Ô nhập luôn là chuỗi; kết quả giữ nguyên văn (có thể là "<0.5", "Âm tính") nên không ép kiểu số.
// Không so kết quả với khoảng tham chiếu (BR-033) và không có kiểm tra khoảng khả dĩ (BR-021 chỉ cho số đo).
const orNull = (text: string) => (text.trim() === '' ? null : text.trim());

const itemSchema = z
  .object({ testName: z.string(), value: z.string(), unit: z.string(), referenceRange: z.string() })
  .superRefine((item, ctx) => {
    const issue = (path: keyof typeof item, message: string) =>
      ctx.addIssue({ code: 'custom', path: [path], message });
    if (item.testName.trim() === '') issue('testName', 'Nhập tên chỉ số ghi trên phiếu.');
    if (item.value.trim() === '') issue('value', 'Nhập kết quả ghi trên phiếu.');
  });

export const labResultFormSchema = z.object({
  resultDate: z.string().min(1, 'Nhập ngày trả kết quả ghi trên phiếu.'),
  facility: z.string(),
  items: z.array(itemSchema).min(1, 'Phiếu xét nghiệm cần ít nhất một chỉ số.'),
});
export type LabResultFormValues = z.infer<typeof labResultFormSchema>;
export type LabResultItemValues = LabResultFormValues['items'][number];

// Thứ tự lời nhắn trong tóm tắt dòng lỗi.
export const LAB_RESULT_ROW_FIELDS = ['testName', 'value'] as const;

export const emptyLabResultItem = (): LabResultItemValues => ({
  testName: '',
  value: '',
  unit: '',
  referenceRange: '',
});

export function toLabResultFormValues(payload: LabResultPayload | null): LabResultFormValues {
  const items = payload?.items.map((item) => ({
    testName: item.testName,
    value: item.value ?? '',
    unit: item.unit ?? '',
    referenceRange: item.referenceRange ?? '',
  }));
  return {
    resultDate: payload?.resultDate ?? '',
    facility: payload?.facility ?? '',
    items: items?.length ? items : [emptyLabResultItem()],
  };
}

// Bản đối soát cùng hình dạng payload §2.1b gửi lên API duyệt; giữ nguyên văn tên, đơn vị, khoảng tham chiếu (BR-022).
export function toLabResultApproval(form: LabResultFormValues): LabResultApproval {
  return {
    type: 'lab_result',
    resultDate: form.resultDate,
    facility: orNull(form.facility),
    items: form.items.map((item) => ({
      testName: item.testName.trim(),
      value: item.value.trim(),
      unit: orNull(item.unit),
      referenceRange: orNull(item.referenceRange),
    })),
  };
}
