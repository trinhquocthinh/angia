import { z } from 'zod';
import { labResultSchema } from '../labResults/labResultSchema.js';
import { measurementSchema } from '../measurements/measurementSchema.js';
import { prescriptionSchema } from '../prescriptions/prescriptionSchema.js';
import { documentTypeSchema, sourceDocumentSchema } from './uploadBatchSchemas.js';

// SPEC-028: cursor là chuỗi mờ do server cấp (entryDate, createdAt, id); server tự kiểm khi giải mã.
export const documentEntryQuerySchema = z.object({
  type: documentTypeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().min(1).max(200).optional(),
});

// Chứng từ ảnh hoặc đơn/phiếu nhập trực tiếp; `records` chỉ có dữ liệu khi bản ghi đã lưu.
// Không có trường nhận định nào (BR-033).
export const documentEntrySchema = z
  .object({
    id: z.uuid(),
    origin: z.enum(['document', 'manual']),
    type: documentTypeSchema.nullable(),
    status: z.enum([...sourceDocumentSchema.shape.status.options, 'manual_record']),
    entryDate: z.iso.date(),
    dateKnown: z.boolean(),
    createdAt: z.iso.datetime(),
    hasImage: z.boolean(),
    records: z.object({
      prescription: prescriptionSchema.nullable(),
      labResults: z.array(labResultSchema),
      measurements: z.array(measurementSchema),
    }),
  })
  .meta({ id: 'DocumentEntry' });
export type DocumentEntry = z.infer<typeof documentEntrySchema>;

export const documentEntryPageSchema = z
  .object({ items: z.array(documentEntrySchema), nextCursor: z.string().nullable() })
  .meta({ id: 'DocumentEntryPage' });
export type DocumentEntryPage = z.infer<typeof documentEntryPageSchema>;
