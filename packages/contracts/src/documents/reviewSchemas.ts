import { z } from 'zod';
import { extractionPayloadSchema } from '../extraction/extractionPayloadSchema.js';
import { labResultSchema } from '../labResults/labResultSchema.js';
import { measurementSchema } from '../measurements/measurementSchema.js';
import { prescriptionSchema } from '../prescriptions/prescriptionSchema.js';
import {
  deviceReadingApprovalSchema,
  labResultApprovalSchema,
  prescriptionApprovalSchema,
} from './approvalDataSchemas.js';
import { sourceDocumentSchema } from './uploadBatchSchemas.js';

export { deviceReadingApprovalSchema };

// SPEC-010: lệnh duyệt theo loại chứng từ; `confirmOutOfRange` chỉ có nghĩa với số đo máy (SPEC-019),
// `confirmDuplicate` xác nhận lưu thêm dù trùng bản đã lưu (SPEC-012, BR-017).
const confirmDuplicate = z.boolean().optional();
export const approveDocumentRequestSchema = z
  .discriminatedUnion('type', [
    z.object({
      type: z.literal('device_reading'),
      data: deviceReadingApprovalSchema,
      confirmOutOfRange: z.boolean().optional(),
      confirmDuplicate,
    }),
    z.object({ type: z.literal('prescription'), data: prescriptionApprovalSchema, confirmDuplicate }),
    z.object({ type: z.literal('lab_result'), data: labResultApprovalSchema, confirmDuplicate }),
  ])
  .meta({ id: 'ApproveDocumentRequest' });
export type ApproveDocumentRequest = z.infer<typeof approveDocumentRequestSchema>;

export const approvedDocumentResponseSchema = z
  .object({
    document: sourceDocumentSchema,
    measurements: z.array(measurementSchema),
    prescription: prescriptionSchema.nullable(),
    labResults: z.array(labResultSchema),
  })
  .meta({ id: 'ApprovedDocumentResponse' });
export type ApprovedDocumentResponse = z.infer<typeof approvedDocumentResponseSchema>;

// Bản trích xuất mới nhất để điền sẵn form; null khi chưa có hoặc payload không còn khớp hợp đồng.
export const documentReviewResponseSchema = z
  .object({ document: sourceDocumentSchema, extraction: extractionPayloadSchema.nullable() })
  .meta({ id: 'DocumentReview' });
export type DocumentReview = z.infer<typeof documentReviewResponseSchema>;

// F09a: danh sách chứng từ phân trang cursor; cursor là id chứng từ cuối của trang trước.
export const documentListQuerySchema = z.object({
  // Lặp tham số để lọc nhiều trạng thái: ?status=uploaded&status=extracting&status=pending_review
  status: z.union([sourceDocumentSchema.shape.status, z.array(sourceDocumentSchema.shape.status)]).optional(),
  profileId: z.uuid().optional(),
  batchId: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.uuid().optional(),
});

export const sourceDocumentPageSchema = z
  .object({ items: z.array(sourceDocumentSchema), nextCursor: z.uuid().nullable() })
  .meta({ id: 'SourceDocumentPage' });
export type SourceDocumentPage = z.infer<typeof sourceDocumentPageSchema>;

// SPEC-011 nhập trực tiếp không kèm chứng từ: cùng thân lệnh với duyệt, trả các bản ghi đã lưu
// (đều có `manualWithoutSource = true`, `sourceDocumentId = null`).
export const manualRecordsResponseSchema = approvedDocumentResponseSchema
  .omit({ document: true })
  .meta({ id: 'ManualRecordsResponse' });
export type ManualRecordsResponse = z.infer<typeof manualRecordsResponseSchema>;
