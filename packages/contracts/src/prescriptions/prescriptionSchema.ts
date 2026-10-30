import { z } from 'zod';

// 4 buổi trong ngày — thuốc bổ tự khai và bản trích xuất AI chỉ dùng tập này.
export const dailyDoseSlotSchema = z.enum(['morning', 'noon', 'afternoon', 'evening']);
// Dòng thuốc từ đơn thêm "Khi cần" (`as_needed`, BR-025 2026-10-12), chỉ được đứng một mình.
export const doseSlotSchema = z.enum([...dailyDoseSlotSchema.options, 'as_needed']);
export const isMixedAsNeeded = (slots: readonly string[]) => slots.includes('as_needed') && slots.length > 1;

// Đơn thuốc đã duyệt (SPEC-010); dòng thuốc theo thứ tự trên đơn.
export const prescriptionSchema = z
  .object({
    id: z.uuid(),
    healthProfileId: z.uuid(),
    sourceDocumentId: z.uuid().nullable(),
    issuedDate: z.iso.date(),
    revisitDate: z.iso.date().nullable(),
    facility: z.string().nullable(),
    diagnosis: z.string().nullable(),
    manualWithoutSource: z.boolean(),
    createdAt: z.iso.datetime(),
    items: z.array(
      z.object({
        id: z.uuid(),
        name: z.string(),
        strength: z.string().nullable(),
        quantityPerDose: z.number().nullable(),
        externalUse: z.boolean(),
        doseUnit: z.string().nullable(),
        slots: z.array(doseSlotSchema),
        durationDays: z.number().int().nullable(),
        longTerm: z.boolean(),
        note: z.string().nullable(),
        totalQuantity: z.number().nullable(),
      }),
    ),
  })
  .meta({ id: 'Prescription' });
export type Prescription = z.infer<typeof prescriptionSchema>;
