import { z } from 'zod';
import { extractionPayloadSchema } from '../extraction/extractionPayloadSchema.js';
import { measurementSchema } from '../measurements/measurementSchema.js';
import { sourceDocumentSchema } from './uploadBatchSchemas.js';

// Số nguyên dương có trần để không tràn cột integer; khoảng khả dĩ do domain kiểm (BR-021).
const reading = z.number().int().positive().max(9999).nullable();

// Bản đối soát người dùng gửi lên: trường ngày được phép null để API trả ERR_DOCUMENT_DATE_REQUIRED (SPEC-010).
export const deviceReadingApprovalSchema = z.object({
  type: z.literal('device_reading'),
  measuredAt: z.iso.date().nullable(),
  measuredTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .nullable(),
  kind: z.enum(['blood_pressure', 'glucose']),
  systolic: reading,
  diastolic: reading,
  pulse: reading,
  glucoseValue: z.number().positive().max(9999).nullable(),
  glucoseUnit: z.enum(['mmol/L', 'mg/dL']).nullable(),
});

// E2-S6-T1 chỉ duyệt số đo máy; đơn thuốc/xét nghiệm mở rộng ở E3-S3-T3.
export const approveDocumentRequestSchema = z
  .object({
    type: z.literal('device_reading'),
    data: deviceReadingApprovalSchema,
    confirmOutOfRange: z.boolean().optional(),
  })
  .meta({ id: 'ApproveDocumentRequest' });
export type ApproveDocumentRequest = z.infer<typeof approveDocumentRequestSchema>;

export const approvedDocumentResponseSchema = z
  .object({ document: sourceDocumentSchema, measurements: z.array(measurementSchema) })
  .meta({ id: 'ApprovedDocumentResponse' });
export type ApprovedDocumentResponse = z.infer<typeof approvedDocumentResponseSchema>;

// Bản trích xuất mới nhất để điền sẵn form; null khi chưa có hoặc payload không còn khớp hợp đồng.
export const documentReviewResponseSchema = z
  .object({ document: sourceDocumentSchema, extraction: extractionPayloadSchema.nullable() })
  .meta({ id: 'DocumentReview' });
export type DocumentReview = z.infer<typeof documentReviewResponseSchema>;
