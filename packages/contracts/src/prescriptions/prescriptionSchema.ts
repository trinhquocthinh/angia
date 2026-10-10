import { z } from 'zod';

export const doseSlotSchema = z.enum(['morning', 'noon', 'afternoon', 'evening']);

// Đơn thuốc đã duyệt (SPEC-010); dòng thuốc theo thứ tự trên đơn.
export const prescriptionSchema = z
  .object({
    id: z.uuid(),
    healthProfileId: z.uuid(),
    sourceDocumentId: z.uuid().nullable(),
    issuedDate: z.iso.date(),
    facility: z.string().nullable(),
    diagnosis: z.string().nullable(),
    manualWithoutSource: z.boolean(),
    createdAt: z.iso.datetime(),
    items: z.array(
      z.object({
        id: z.uuid(),
        name: z.string(),
        strength: z.string().nullable(),
        quantityPerDose: z.number(),
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
