import { z } from 'zod';
import type { MedicationCourse, RecordAsNeededDoseRequest } from '@angia/contracts';

// Người dùng nhập giờ Việt Nam, không phụ thuộc múi giờ thiết bị.
export function asNeededDoseFormSchema(
  course: Pick<MedicationCourse, 'id' | 'startDate' | 'endDate'>,
  now = new Date(),
) {
  return z
    .object({
      givenAt: z.string().refine((value) => {
        if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return false;
        const time = Date.parse(`${value}+07:00`);
        if (!Number.isFinite(time)) return false;
        const roundTrip = new Date(time + 7 * 3_600_000).toISOString().slice(0, 16);
        const day = value.slice(0, 10);
        return (
          roundTrip === value &&
          time <= now.getTime() &&
          day >= course.startDate &&
          (course.endDate === null || day <= course.endDate)
        );
      }, 'Nhập ngày/giờ hợp lệ, không ở tương lai và trong thời gian hiệu lực của đợt.'),
      quantity: z
        .string()
        .trim()
        .refine(
          (value) =>
            value === '' ||
            (/^\d+([.,]\d+)?$/.test(value) &&
              Number(value.replace(',', '.')) > 0 &&
              Number(value.replace(',', '.')) <= 1000),
          'Nhập số lượng lớn hơn 0, tối đa 1000; ví dụ 0,125.',
        ),
      unit: z.string().trim().max(20, 'Đơn vị tối đa 20 ký tự.'),
    })
    .transform((values): RecordAsNeededDoseRequest => ({
      courseId: course.id,
      givenAt: new Date(`${values.givenAt}+07:00`).toISOString(),
      quantity: values.quantity === '' ? null : Number(values.quantity.replace(',', '.')),
      unit: values.unit || null,
    }));
}
