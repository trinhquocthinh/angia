import { z } from 'zod';

const MAX_RANGE_DAYS = 366;
const daySpan = (from: string, to: string) => (Date.parse(to) - Date.parse(from)) / 86_400_000 + 1;

// BR-054: khoảng cách chỉ hiện khi có nguồn; luôn kèm nhãn nguồn, không có giá trị mặc định.
export const doseIntervalSchema = z
  .object({ text: z.string(), source: z.enum(['prescription', 'user']) })
  .meta({ id: 'DoseInterval' });
export type DoseInterval = z.infer<typeof doseIntervalSchema>;

// SPEC-047: liều và đơn vị do người ghi nhập, không tự điền từ đơn.
export const recordAsNeededDoseRequestSchema = z
  .strictObject({
    courseId: z.uuid(),
    givenAt: z.iso.datetime({ offset: true }),
    quantity: z.number().positive().max(1000).nullable().default(null),
    unit: z.string().trim().min(1).max(20).nullable().default(null),
  })
  .meta({ id: 'RecordAsNeededDoseRequest' });
export type RecordAsNeededDoseRequest = z.infer<typeof recordAsNeededDoseRequestSchema>;

// Không có trường giờ liều tiếp hay cảnh báo cho sớm (BR-054, BR-033).
export const asNeededDoseSchema = z
  .object({
    id: z.uuid(),
    courseId: z.uuid(),
    givenAt: z.iso.datetime(),
    quantity: z.number().nullable(),
    unit: z.string().nullable(),
    recordedBy: z.uuid().nullable(),
    recordedAt: z.iso.datetime(),
  })
  .meta({ id: 'AsNeededDose' });
export type AsNeededDose = z.infer<typeof asNeededDoseSchema>;

// Ngày theo giờ Việt Nam, tính cả hai đầu, tối đa 366 ngày.
export const asNeededDoseQuerySchema = z
  .object({ courseId: z.uuid().optional(), from: z.iso.date(), to: z.iso.date() })
  .refine(({ from, to }) => from <= to && daySpan(from, to) <= MAX_RANGE_DAYS, {
    message: `Khoảng thời gian phải từ 1 đến ${MAX_RANGE_DAYS} ngày`,
    path: ['to'],
  });

export const asNeededDoseListSchema = z
  .object({ doses: z.array(asNeededDoseSchema) })
  .meta({ id: 'AsNeededDoseList' });
export type AsNeededDoseList = z.infer<typeof asNeededDoseListSchema>;

export const setCourseIntervalRequestSchema = z
  .strictObject({ text: z.string().trim().min(1).max(100).nullable() })
  .meta({ id: 'SetCourseIntervalRequest' });
export type SetCourseIntervalRequest = z.infer<typeof setCourseIntervalRequestSchema>;

// Khoảng cách hiệu lực sau khi lưu: giá trị in trên đơn vẫn được ưu tiên.
export const courseIntervalSchema = z
  .object({ courseId: z.uuid(), interval: doseIntervalSchema.nullable() })
  .meta({ id: 'CourseInterval' });
export type CourseInterval = z.infer<typeof courseIntervalSchema>;
