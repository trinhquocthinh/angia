import { z } from 'zod';

const documentTypeSchema = z.enum(['prescription', 'lab_result', 'device_reading']);

// Không trả khóa S3: ảnh chỉ đọc qua route stream có kiểm tra gia đình (Tech Spec §4).
export const sourceDocumentSchema = z
  .object({
    id: z.uuid(),
    healthProfileId: z.uuid(),
    batchId: z.uuid(),
    type: documentTypeSchema.nullable(),
    status: z.enum([
      'uploaded',
      'extracting',
      'pending_review',
      'approved',
      'rejected',
      'manual_entry',
      'awaiting_budget',
    ]),
    documentDate: z.iso.date().nullable(),
    mimeType: z.string(),
    sizeBytes: z.number().int(),
    createdAt: z.iso.datetime(),
  })
  .meta({ id: 'SourceDocument' });
export type SourceDocument = z.infer<typeof sourceDocumentSchema>;

export const uploadBatchResponseSchema = z
  .object({
    id: z.uuid(),
    documents: z.array(sourceDocumentSchema),
    rejectedFiles: z.array(
      z.object({ fileName: z.string(), code: z.enum(['ERR_UNSUPPORTED_FILE', 'ERR_FILE_TOO_LARGE']) }),
    ),
  })
  .meta({ id: 'UploadBatchResponse' });
export type UploadBatchResponse = z.infer<typeof uploadBatchResponseSchema>;

const binaryFileSchema = z.file().meta({ type: 'string', format: 'binary' });

// Multipart: trường `files` lặp lại (E2-S5-T1 chỉ nhận 1 tệp), `declaredType` tùy chọn.
export const uploadBatchRequestSchema = z
  .object({
    files: z.union([binaryFileSchema, z.array(binaryFileSchema)]),
    declaredType: documentTypeSchema.optional(),
  })
  .meta({ id: 'UploadBatchRequest' });
