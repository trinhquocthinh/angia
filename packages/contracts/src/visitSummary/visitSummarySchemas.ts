import { z } from 'zod';
import { adherencePeriodSchema } from '../adherence/adherencePeriodSchemas.js';
import { labResultSchema } from '../labResults/labResultSchema.js';
import { measurementSchema } from '../measurements/measurementSchema.js';
import { currentMedicationCourseSchema } from '../medications/currentMedicationSchemas.js';
import {
  bodyLocationSchema,
  exerciseNoteSchema,
  painEntrySchema,
  painIssueSummarySchema,
} from '../painJournal/schemas.js';

// SPEC-024: bỏ trống → to = hôm nay (Việt Nam), from = to lùi 3 tháng; from ≤ to ≤ hôm nay,
// tối đa 366 ngày — kiểm ở Application vì cần ngày hiện tại → sai → ERR_VALIDATION.
export const visitSummaryQuerySchema = z.object({
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
});

// BR-064: vấn đề tracking tại ngày tạo + vấn đề có lần ghi trong [from, to]; chỉ dữ liệu người dùng nhập.
const visitSummaryPainIssueSchema = bodyLocationSchema.safeExtend({
  title: painIssueSummarySchema.shape.title,
  status: painIssueSummarySchema.shape.status,
  resolvedOn: painIssueSummarySchema.shape.resolvedOn,
  /** Lần ghi có thời điểm (giờ VN) trong [from, to], cũ nhất trước. */
  entries: z.array(painEntrySchema.pick({ recordedAt: true, level: true, note: true, createdBy: true })),
  /** Bài tập có [startDate, endDate ?? to] giao [from, to]. */
  exercises: z.array(
    exerciseNoteSchema.pick({
      name: true,
      source: true,
      prescriber: true,
      startDate: true,
      endDate: true,
      note: true,
    }),
  ),
});

// BR-034/BR-035: chỉ dữ liệu đã duyệt, kèm ngày tạo, khoảng dữ liệu và dòng miễn trừ nguyên văn;
// không có trường nhận xét/đánh giá (BR-033).
export const visitSummarySchema = z
  .object({
    profile: z.object({ id: z.uuid(), displayName: z.string(), birthYear: z.number().int().nullable() }),
    createdAt: z.iso.datetime(),
    from: z.iso.date(),
    to: z.iso.date(),
    showsVitals: z.boolean(),
    /** SPEC-018 tại ngày tạo. */
    currentMedications: z.array(currentMedicationCourseSchema),
    /** BR-049: rỗng khi showsVitals = false; còn lại giữ khoảng và đơn vị gốc (BR-020). */
    measurements: z.array(measurementSchema),
    /** Kết quả mới nhất từng chỉ số có ngày ≤ to; chỉ số có kết quả mới nhất trước. */
    latestLabResults: z.array(labResultSchema),
    /** SPEC-023: giai đoạn giao [from, to], mốc giữ nguyên. */
    adherencePeriods: z.array(adherencePeriodSchema),
    /** BR-064: tracking trước, rồi vùng theo thứ tự danh mục; không ẩn theo BR-049. */
    painIssues: z.array(visitSummaryPainIssueSchema),
    disclaimer: z.literal('Tài liệu tổng hợp từ gia đình, không phải chỉ định y khoa.'),
  })
  .meta({ id: 'VisitSummary' });
export type VisitSummary = z.infer<typeof visitSummarySchema>;
