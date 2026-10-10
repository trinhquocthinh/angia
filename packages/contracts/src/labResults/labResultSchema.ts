import { z } from 'zod';

// Một chỉ số xét nghiệm đã duyệt; tên, giá trị, đơn vị, khoảng tham chiếu giữ nguyên văn phiếu (BR-022).
export const labResultSchema = z
  .object({
    id: z.uuid(),
    healthProfileId: z.uuid(),
    sourceDocumentId: z.uuid().nullable(),
    resultDate: z.iso.date(),
    testName: z.string(),
    value: z.string(),
    unit: z.string().nullable(),
    referenceRange: z.string().nullable(),
    facility: z.string().nullable(),
    manualWithoutSource: z.boolean(),
    createdAt: z.iso.datetime(),
  })
  .meta({ id: 'LabResult' });
export type LabResult = z.infer<typeof labResultSchema>;
