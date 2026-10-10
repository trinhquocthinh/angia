import { z } from 'zod';
import { sortDoseSlots } from './doseSlots';
import type { PrescriptionApproval, PrescriptionPayload } from './reviewPorts';

// Ô nhập luôn là chuỗi; kiểm tra phía client để chỉ đúng dòng thiếu liều/buổi (BR-025), API vẫn quyết định.
const DECIMAL = /^\d+([.,]\d+)?$/;
const INTEGER = /^\d+$/;
const toNumber = (text: string) => Number(text.trim().replace(',', '.'));
const orNull = (text: string) => (text.trim() === '' ? null : text.trim());

const itemSchema = z
  .object({
    name: z.string(),
    strength: z.string(),
    quantityPerDose: z.string(),
    doseUnit: z.string(),
    slots: z.array(z.enum(['morning', 'noon', 'afternoon', 'evening'])),
    durationDays: z.string(),
    longTerm: z.boolean(),
    note: z.string(),
    // Tổng số lượng in trên đơn, chỉ để gợi ý số ngày (BR-025); tùy chọn.
    totalQuantity: z.string(),
    // Dòng do AI điền sẵn: liều cần đối chiếu kỹ với ảnh (E1: model từng nhân đôi liều).
    fromAi: z.boolean(),
  })
  .superRefine((item, ctx) => {
    const issue = (path: keyof typeof item, message: string) =>
      ctx.addIssue({ code: 'custom', path: [path], message });
    if (item.name.trim() === '') issue('name', 'Nhập tên thuốc.');
    const quantity = item.quantityPerDose.trim();
    if (quantity === '') issue('quantityPerDose', 'Nhập số lượng mỗi lần dùng.');
    else if (!DECIMAL.test(quantity) || toNumber(quantity) <= 0)
      issue('quantityPerDose', 'Nhập số lớn hơn 0, ví dụ 1 hoặc 0,5.');
    if (item.slots.length === 0) issue('slots', 'Chọn ít nhất một buổi dùng.');
    const total = item.totalQuantity.trim();
    if (total !== '' && (!DECIMAL.test(total) || toNumber(total) <= 0))
      issue('totalQuantity', 'Nhập số lớn hơn 0 hoặc để trống.');
    if (item.longTerm) return;
    const days = item.durationDays.trim();
    if (days === '') issue('durationDays', 'Nhập số ngày dùng hoặc chọn Dài hạn.');
    else if (!INTEGER.test(days) || Number(days) === 0)
      issue('durationDays', 'Nhập số ngày là số nguyên dương.');
  });

export const prescriptionFormSchema = z.object({
  issuedDate: z.string().min(1, 'Nhập ngày kê ghi trên đơn.'),
  facility: z.string(),
  diagnosis: z.string(),
  items: z.array(itemSchema).min(1, 'Đơn thuốc cần ít nhất một dòng thuốc.'),
});
export type PrescriptionFormValues = z.infer<typeof prescriptionFormSchema>;
export type PrescriptionItemValues = PrescriptionFormValues['items'][number];

// Thứ tự lời nhắn trong tóm tắt dòng lỗi.
export const PRESCRIPTION_ROW_FIELDS = [
  'name',
  'quantityPerDose',
  'totalQuantity',
  'slots',
  'durationDays',
] as const;

const text = (value: number | string | null) => (value === null ? '' : String(value));

export const emptyPrescriptionItem = (): PrescriptionItemValues => ({
  name: '',
  strength: '',
  quantityPerDose: '',
  doseUnit: '',
  slots: [],
  durationDays: '',
  longTerm: false,
  note: '',
  totalQuantity: '',
  fromAi: false,
});

export function toPrescriptionFormValues(payload: PrescriptionPayload | null): PrescriptionFormValues {
  const items = payload?.items.map((item) => ({
    name: item.name,
    strength: text(item.strength),
    quantityPerDose: text(item.quantityPerDose),
    doseUnit: text(item.doseUnit),
    slots: sortDoseSlots(item.slots),
    durationDays: text(item.durationDays),
    longTerm: item.longTerm,
    note: text(item.note),
    totalQuantity: text(item.totalQuantity),
    fromAi: true,
  }));
  return {
    issuedDate: text(payload?.issuedDate ?? null),
    facility: text(payload?.facility ?? null),
    diagnosis: text(payload?.diagnosis ?? null),
    items: items?.length ? items : [emptyPrescriptionItem()],
  };
}

// Bản đối soát cùng hình dạng payload §2.1a gửi lên API duyệt (E3-S3-T3).
export function toPrescriptionApproval(form: PrescriptionFormValues): PrescriptionApproval {
  return {
    type: 'prescription',
    issuedDate: form.issuedDate,
    facility: orNull(form.facility),
    diagnosis: orNull(form.diagnosis),
    items: form.items.map((item) => ({
      name: item.name.trim(),
      strength: orNull(item.strength),
      quantityPerDose: toNumber(item.quantityPerDose),
      doseUnit: orNull(item.doseUnit),
      slots: sortDoseSlots(item.slots),
      durationDays: item.longTerm ? null : toNumber(item.durationDays),
      longTerm: item.longTerm,
      note: orNull(item.note),
      totalQuantity: item.totalQuantity.trim() === '' ? null : toNumber(item.totalQuantity),
    })),
  };
}
