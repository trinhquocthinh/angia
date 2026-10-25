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
export const createPrivacyDraftRequestSchema = z
  .object({
    rotation: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]),
    crop: privacyRectangleSchema,
    masks: z.array(privacyRectangleSchema).max(32),
  })
  .strict()
  .meta({ id: 'CreatePrivacyDraftRequest' });
export const approvePrivacyRequestSchema = z
  .object({
    draftId: z.uuid(),
    sha256: z.string().regex(/^[0-9a-f]{64}$/),
    confirmed: z.literal(true),
  })
  .strict()
  .meta({ id: 'ApprovePrivacyRequest' });
export const privacyDraftSchema = z
  .discriminatedUnion('state', [
    z.object({ state: z.literal('none') }).strict(),
    z.object({ state: z.literal('pending'), draftId: z.uuid() }).strict(),
    z.object({ state: z.literal('failed'), draftId: z.uuid() }).strict(),
    z
      .object({
        state: z.literal('ready'),
        draftId: z.uuid(),
        sha256: z.string().regex(/^[0-9a-f]{64}$/),
        imageUrl: z.string(),
      })
      .strict(),
  ])
  .meta({ id: 'PrivacyDraft' });
export type PrivacyRectangle = z.infer<typeof privacyRectangleSchema>;
export type PrivacyEdits = z.infer<typeof createPrivacyDraftRequestSchema>;
export type CreatePrivacyDraftRequest = PrivacyEdits;
export type ApprovePrivacyRequest = z.infer<typeof approvePrivacyRequestSchema>;
export type PrivacyDraft = z.infer<typeof privacyDraftSchema>;
