import { z } from 'zod';
import { prescriptionSchema } from './prescriptionSchema.js';

const item = prescriptionSchema.shape.items.element;
const change = <K extends string, T extends z.ZodType>(field: K, value: T) =>
  z.strictObject({ field: z.literal(field), before: value, after: value });

// Union theo field giữ kiểu before/after đúng; không nhận trường nhận định (BR-033).
export const prescriptionDiffSchema = z
  .strictObject({
    added: z.array(z.strictObject({ name: z.string(), items: z.array(item).min(1) })),
    removed: z.array(z.strictObject({ name: z.string(), items: z.array(item).min(1) })),
    changed: z.array(
      z.strictObject({
        name: z.string(),
        changes: z
          .array(
            z.discriminatedUnion('field', [
              change('strength', item.shape.strength),
              change('quantityPerDose', item.shape.quantityPerDose),
              change('doseUnit', item.shape.doseUnit),
              change('slots', item.shape.slots),
              change('durationDays', item.shape.durationDays),
              change('longTerm', item.shape.longTerm),
              change('externalUse', item.shape.externalUse),
              change('lines', z.array(item)),
            ]),
          )
          .min(1),
      }),
    ),
  })
  .meta({ id: 'PrescriptionDiff' });
export type PrescriptionDiff = z.infer<typeof prescriptionDiffSchema>;
