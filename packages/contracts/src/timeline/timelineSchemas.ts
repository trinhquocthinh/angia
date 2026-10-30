import { z } from 'zod';
import { labResultSchema } from '../labResults/labResultSchema.js';
import { measurementSchema } from '../measurements/measurementSchema.js';

const timelineKindSchema = z.enum([
  'prescription',
  'lab_result',
  'measurement',
  'course_stopped',
  'adherence_period',
  'revisit',
]);
const timeSchema = z
  .string()
  .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
  .nullable();
const key = { id: z.string().min(1), date: z.iso.date(), time: timeSchema };

// E13-S5-T1: sáu nguồn hiện có; nhiệt độ/liều Khi cần bổ sung ở E15.
export const timelineEventSchema = z
  .discriminatedUnion('kind', [
    z.object({
      ...key,
      kind: z.literal('prescription'),
      data: z.object({
        prescriptionId: z.uuid(),
        facility: z.string().nullable(),
        diagnosis: z.string().nullable(),
        itemCount: z.number().int().nonnegative(),
        diffSummary: z
          .object({
            added: z.number().int().nonnegative(),
            removed: z.number().int().nonnegative(),
            changed: z.number().int().nonnegative(),
          })
          .nullable(),
      }),
    }),
    z.object({
      ...key,
      kind: z.literal('lab_result'),
      data: z.object({
        groupId: z.uuid(),
        facility: z.string().nullable(),
        results: z.array(labResultSchema),
      }),
    }),
    z.object({ ...key, kind: z.literal('measurement'), data: measurementSchema }),
    z.object({
      ...key,
      kind: z.literal('course_stopped'),
      data: z.object({ courseId: z.uuid(), name: z.string() }),
    }),
    z.object({
      ...key,
      kind: z.literal('adherence_period'),
      data: z.object({
        medicationName: z.string(),
        status: z.enum(['taking', 'stopped']),
      }),
    }),
    z.object({ ...key, kind: z.literal('revisit'), data: z.object({ prescriptionIds: z.array(z.uuid()) }) }),
  ])
  .meta({ id: 'TimelineEvent' });

export const timelineQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().min(1).max(1024).optional(),
});
export const timelinePageSchema = z
  .object({
    items: z.array(timelineEventSchema),
    nextCursor: z.string().nullable(),
  })
  .meta({ id: 'TimelinePage' });

// Cursor chỉ chứa khóa; lịch hẹn tổng hợp dùng ngày làm ID, nguồn còn lại dùng UUID.
export const timelineCursorSchema = z
  .strictObject({ ...key, kind: timelineKindSchema })
  .refine((value) =>
    value.kind === 'revisit'
      ? value.id === value.date && value.time === null
      : z.uuid().safeParse(value.id).success,
  );

export type TimelineEvent = z.infer<typeof timelineEventSchema>;
export type TimelinePage = z.infer<typeof timelinePageSchema>;
export type TimelineQuery = z.infer<typeof timelineQuerySchema>;
export type TimelineCursor = z.infer<typeof timelineCursorSchema>;
