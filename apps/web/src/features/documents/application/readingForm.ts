import { z } from 'zod';
import type { ApproveDocumentRequest, DeviceReadingPayload } from './reviewPorts';

// Giá trị ô nhập luôn là chuỗi; kiểm tra phía client chỉ để báo sớm cạnh trường, API vẫn quyết định (SPEC-019).
const INTEGER = /^\d+$/;
const DECIMAL = /^\d+([.,]\d+)?$/;
const toNumber = (text: string) => (text.trim() === '' ? null : Number(text.trim().replace(',', '.')));

export const readingFormSchema = z
  .object({
    measuredAt: z.string().min(1, 'Nhập ngày đo ghi trên máy.'),
    measuredTime: z.string(),
    kind: z.enum(['blood_pressure', 'glucose']),
    systolic: z.string(),
    diastolic: z.string(),
    pulse: z.string(),
    glucoseValue: z.string(),
    glucoseUnit: z.enum(['', 'mmol/L', 'mg/dL']),
  })
  .superRefine((form, ctx) => {
    const issue = (path: keyof typeof form, message: string) =>
      ctx.addIssue({ code: 'custom', path: [path], message });
    if (form.kind === 'glucose') {
      if (form.glucoseValue.trim() === '') issue('glucoseValue', 'Nhập chỉ số đường huyết.');
      else if (!DECIMAL.test(form.glucoseValue.trim())) issue('glucoseValue', 'Nhập số, ví dụ 7,2.');
      if (form.glucoseUnit === '') issue('glucoseUnit', 'Chọn đơn vị mmol/L hoặc mg/dL.');
      return;
    }
    const required = { systolic: 'Nhập số tâm thu.', diastolic: 'Nhập số tâm trương.' } as const;
    for (const field of ['systolic', 'diastolic', 'pulse'] as const) {
      const text = form[field].trim();
      if (text === '' && field !== 'pulse') issue(field, required[field]);
      else if (text !== '' && !INTEGER.test(text)) issue(field, 'Nhập số nguyên dương.');
    }
    const systolic = toNumber(form.systolic);
    const diastolic = toNumber(form.diastolic);
    if (
      INTEGER.test(form.systolic.trim()) &&
      INTEGER.test(form.diastolic.trim()) &&
      systolic! <= diastolic!
    ) {
      issue('systolic', 'Tâm thu phải lớn hơn tâm trương.');
    }
  });
export type ReadingFormValues = z.infer<typeof readingFormSchema>;

const text = (value: number | string | null) => (value === null ? '' : String(value));

export function toReadingFormValues(payload: DeviceReadingPayload | null): ReadingFormValues {
  return {
    measuredAt: text(payload?.measuredAt ?? null),
    measuredTime: text(payload?.measuredTime ?? null),
    kind: payload?.kind ?? 'blood_pressure',
    systolic: text(payload?.systolic ?? null),
    diastolic: text(payload?.diastolic ?? null),
    pulse: text(payload?.pulse ?? null),
    glucoseValue: text(payload?.glucoseValue ?? null),
    glucoseUnit: payload?.glucoseUnit ?? '',
  };
}

export function toApproveRequest(
  form: ReadingFormValues,
  confirmOutOfRange: boolean,
): ApproveDocumentRequest {
  const pressure = form.kind === 'blood_pressure';
  return {
    type: 'device_reading',
    confirmOutOfRange,
    data: {
      type: 'device_reading',
      measuredAt: form.measuredAt,
      measuredTime: form.measuredTime === '' ? null : form.measuredTime,
      kind: form.kind,
      systolic: pressure ? toNumber(form.systolic) : null,
      diastolic: pressure ? toNumber(form.diastolic) : null,
      pulse: pressure ? toNumber(form.pulse) : null,
      glucoseValue: pressure ? null : toNumber(form.glucoseValue),
      glucoseUnit: pressure || form.glucoseUnit === '' ? null : form.glucoseUnit,
    },
  };
}
