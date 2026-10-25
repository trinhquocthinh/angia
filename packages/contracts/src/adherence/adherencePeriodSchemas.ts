import { z } from 'zod';

const adherenceStatusSchema = z.enum(['taking', 'stopped']).meta({ id: 'AdherenceStatus' });

// SPEC-022: hồ sơ lấy từ đường dẫn; không cho client gửi toDate/recordedBy.
export const recordAdherencePeriodRequestSchema = z
  .strictObject({
    medicationName: z.string().trim().min(1).max(200),
    status: adherenceStatusSchema,
    fromDate: z.iso.date(),
  })
  .meta({ id: 'RecordAdherencePeriodRequest' });
export type RecordAdherencePeriodRequest = z.infer<typeof recordAdherencePeriodRequestSchema>;

// BR-033: chỉ dữ liệu ngày/trạng thái, không có trường nhận xét.
export const adherencePeriodSchema = z
  .object({
    id: z.uuid(),
    healthProfileId: z.uuid(),
    medicationName: z.string(),
    status: adherenceStatusSchema,
    fromDate: z.iso.date(),
    toDate: z.iso.date().nullable(),
  })
  .meta({ id: 'AdherencePeriod' });
export type AdherencePeriod = z.infer<typeof adherencePeriodSchema>;

export const adherencePeriodListSchema = z
  .object({ today: z.iso.date(), periods: z.array(adherencePeriodSchema) })
  .meta({ id: 'AdherencePeriodList' });
export type AdherencePeriodList = z.infer<typeof adherencePeriodListSchema>;
