import { z } from 'zod';
import { bodyRegions, type BodyRegion } from './bodyRegions.js';
import { painJournalLimits as limits } from './limits.js';
import { medicationCourseSchema } from '../medications/selfReportedCourseSchemas.js';

export const bodyRegionSchema = z.enum(Object.keys(bodyRegions) as [BodyRegion, ...BodyRegion[]]);
export const bodySideSchema = z.enum(['left', 'right', 'center']);
export const painIssueStatusSchema = z.enum(['tracking', 'resolved']);
export const exerciseSourceSchema = z.enum(['prescribed', 'self']);
const level = z.number().int().min(limits.minLevel).max(limits.maxLevel);
const timestamp = z.iso.datetime({ offset: true });
const entryNote = z
  .string()
  .trim()
  .max(limits.entryNoteLength)
  .transform((value) => value || null);
const title = z.string().max(limits.titleLength);

export const bodyLocationSchema = z
  .strictObject({ region: bodyRegionSchema, side: bodySideSchema })
  .refine(({ region, side }) => bodyRegions[region].sides.some((value) => value === side), {
    path: ['side'],
    message: 'Bên không phù hợp với vùng cơ thể.',
  });

// Đồng hồ server, thời điểm mặc định và dữ liệu hiện có do application xử lý.
export const createPainEntryRequestSchema = z
  .strictObject({
    level,
    recordedAt: timestamp.optional(),
    note: entryNote.optional(),
  })
  .meta({ id: 'CreatePainEntryRequest' });
export const updatePainEntryRequestSchema = createPainEntryRequestSchema
  .partial()
  .meta({ id: 'UpdatePainEntryRequest' });
export const createPainIssueRequestSchema = bodyLocationSchema
  .safeExtend({
    title: title.optional(),
    firstEntry: createPainEntryRequestSchema,
  })
  .meta({ id: 'CreatePainIssueRequest' });
export const updatePainIssueRequestSchema = z
  .strictObject({
    title: title.optional(),
    region: bodyRegionSchema.optional(),
    side: bodySideSchema.optional(),
  })
  .refine(
    ({ region, side }) => !region || !side || bodyRegions[region].sides.some((value) => value === side),
    {
      path: ['side'],
      message: 'Bên không phù hợp với vùng cơ thể.',
    },
  )
  .meta({ id: 'UpdatePainIssueRequest' });
export const resolvePainIssueRequestSchema = z
  .strictObject({ resolvedOn: z.iso.date() })
  .meta({ id: 'ResolvePainIssueRequest' });
export const reopenPainIssueRequestSchema = z.strictObject({}).meta({ id: 'ReopenPainIssueRequest' });
export const deletePainIssueRequestSchema = z
  .strictObject({ confirm: z.literal(true) })
  .meta({ id: 'DeletePainIssueRequest' });

const exerciseFields = {
  name: z.string().min(1).max(limits.exerciseNameLength),
  source: exerciseSourceSchema,
  prescriber: z.string().max(limits.prescriberLength).optional(),
  startDate: z.iso.date(),
  endDate: z.iso.date().optional(),
  note: z.string().max(limits.exerciseNoteLength).optional(),
};
export const createExerciseNoteRequestSchema = z
  .strictObject(exerciseFields)
  .refine(({ startDate, endDate }) => endDate === undefined || endDate >= startDate, {
    path: ['endDate'],
    message: 'Ngày kết thúc phải từ ngày bắt đầu trở đi.',
  })
  .refine(({ source, prescriber }) => source !== 'self' || prescriber === undefined, {
    path: ['prescriber'],
    message: 'Bài tập tự ghi không có người chỉ định.',
  })
  .meta({ id: 'CreateExerciseNoteRequest' });
// PATCH phải được ghép với dữ liệu hiện có trước khi kiểm đủ ngày; source=self xóa người chỉ định ở application.
export const updateExerciseNoteRequestSchema = z
  .strictObject(exerciseFields)
  .partial()
  .refine(({ startDate, endDate }) => !startDate || !endDate || endDate >= startDate, {
    path: ['endDate'],
    message: 'Ngày kết thúc phải từ ngày bắt đầu trở đi.',
  })
  .meta({ id: 'UpdateExerciseNoteRequest' });
export const painIssueQuerySchema = z.strictObject({
  status: z.enum(['tracking', 'resolved', 'all']).default('all'),
});
export const painContextQuerySchema = z
  .strictObject({ from: z.iso.date().optional(), to: z.iso.date().optional() })
  .refine(
    ({ from, to }) =>
      !from ||
      !to ||
      (from <= to && (Date.parse(to) - Date.parse(from)) / 86_400_000 + 1 <= limits.contextRangeDays),
    {
      path: ['to'],
      message: 'Khoảng thời gian phải từ 1 đến 366 ngày.',
    },
  );

export const actorRefSchema = z.strictObject({ accountId: z.uuid(), displayName: z.string() }).nullable();
const audit = {
  createdBy: actorRefSchema,
  updatedBy: actorRefSchema,
  updatedAt: timestamp,
};
export const painEntrySchema = z
  .strictObject({
    id: z.uuid(),
    level,
    recordedAt: timestamp,
    note: z.string().max(limits.entryNoteLength).nullable(),
    ...audit,
  })
  .meta({ id: 'PainEntry' });
export const exerciseNoteSchema = z
  .strictObject({
    id: z.uuid(),
    name: exerciseFields.name,
    source: exerciseSourceSchema,
    prescriber: z.string().max(limits.prescriberLength).nullable(),
    startDate: z.iso.date(),
    endDate: z.iso.date().nullable(),
    note: z.string().max(limits.exerciseNoteLength).nullable(),
    ...audit,
  })
  .meta({ id: 'ExerciseNote' });
export const painIssueStatusEventSchema = z
  .strictObject({
    kind: z.enum(['resolved', 'reopened']),
    on: z.iso.date(),
    by: actorRefSchema,
    at: timestamp,
  })
  .meta({ id: 'PainIssueStatusEvent' });
export const painIssueSummarySchema = bodyLocationSchema
  .safeExtend({
    id: z.uuid(),
    title: title.nullable(),
    status: painIssueStatusSchema,
    resolvedOn: z.iso.date().nullable(),
    lastEntry: z.strictObject({ level, recordedAt: timestamp }),
    entryCount: z.number().int().min(1),
    exerciseCount: z.number().int().nonnegative(),
    ...audit,
  })
  .meta({ id: 'PainIssueSummary' });
export const painIssueListSchema = z
  .strictObject({ issues: z.array(painIssueSummarySchema) })
  .meta({ id: 'PainIssueList' });
export const painIssueDetailSchema = painIssueSummarySchema
  .safeExtend({
    entries: z.array(painEntrySchema),
    exercises: z.array(exerciseNoteSchema),
    statusEvents: z.array(painIssueStatusEventSchema),
  })
  .meta({ id: 'PainIssueDetail' });
export const painContextSchema = z
  .strictObject({
    from: z.iso.date(),
    to: z.iso.date(),
    asNeededDoses: z.array(
      z.strictObject({
        courseId: z.uuid(),
        name: z.string(),
        givenAt: timestamp,
        quantity: z.number().nullable(),
        unit: z.string().nullable(),
      }),
    ),
    courses: z.array(
      z.strictObject({
        courseId: z.uuid(),
        name: z.string(),
        startDate: z.iso.date(),
        endDate: z.iso.date().nullable(),
        status: medicationCourseSchema.shape.status,
      }),
    ),
  })
  .meta({ id: 'PainContext' });
export const painIssueDeletionImpactSchema = z
  .strictObject({
    entryCount: z.number().int().min(1),
    exerciseCount: z.number().int().nonnegative(),
  })
  .meta({ id: 'PainIssueDeletionImpact' });

export type PainIssueStatus = z.infer<typeof painIssueStatusSchema>;
export type ExerciseSource = z.infer<typeof exerciseSourceSchema>;
export type ActorRef = z.infer<typeof actorRefSchema>;
export type BodyLocation = z.infer<typeof bodyLocationSchema>;
export type CreatePainIssueRequest = z.infer<typeof createPainIssueRequestSchema>;
export type UpdatePainIssueRequest = z.infer<typeof updatePainIssueRequestSchema>;
export type CreatePainEntryRequest = z.infer<typeof createPainEntryRequestSchema>;
export type UpdatePainEntryRequest = z.infer<typeof updatePainEntryRequestSchema>;
export type ResolvePainIssueRequest = z.infer<typeof resolvePainIssueRequestSchema>;
export type ReopenPainIssueRequest = z.infer<typeof reopenPainIssueRequestSchema>;
export type DeletePainIssueRequest = z.infer<typeof deletePainIssueRequestSchema>;
export type CreateExerciseNoteRequest = z.infer<typeof createExerciseNoteRequestSchema>;
export type UpdateExerciseNoteRequest = z.infer<typeof updateExerciseNoteRequestSchema>;
export type PainIssueQuery = z.infer<typeof painIssueQuerySchema>;
export type PainContextQuery = z.infer<typeof painContextQuerySchema>;
export type PainEntry = z.infer<typeof painEntrySchema>;
export type ExerciseNote = z.infer<typeof exerciseNoteSchema>;
export type PainIssueStatusEvent = z.infer<typeof painIssueStatusEventSchema>;
export type PainIssueSummary = z.infer<typeof painIssueSummarySchema>;
export type PainIssueDetail = z.infer<typeof painIssueDetailSchema>;
export type PainIssueList = z.infer<typeof painIssueListSchema>;
export type PainContext = z.infer<typeof painContextSchema>;
export type PainIssueDeletionImpact = z.infer<typeof painIssueDeletionImpactSchema>;
