import { z } from 'zod';
const unit = z.number().int().min(0).max(1_000_000);
const span = z.number().int().min(1).max(1_000_000);
export const privacyRectangleSchema = z
  .object({ left: unit, top: unit, width: span, height: span })
  .strict()
  .refine(
    (rect) => rect.left + rect.width <= 1_000_000 && rect.top + rect.height <= 1_000_000,
    'Vùng chọn phải nằm trong ảnh',
  );
export const privacyEditsSchema = z
  .object({
    rotation: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]),
    crop: privacyRectangleSchema,
    masks: z.array(privacyRectangleSchema).max(32),
  })
  .strict()
  .meta({ id: 'PrivacyEdits' });
export type PrivacyRectangle = z.infer<typeof privacyRectangleSchema>;
export type PrivacyEdits = z.infer<typeof privacyEditsSchema>;
