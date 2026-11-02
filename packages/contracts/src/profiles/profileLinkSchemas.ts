import { z } from 'zod';
import { healthProfileSchema } from './healthProfileSchema.js';

// SPEC-040: link liên kết kiêm đồng thuận. Token nằm trong fragment của url, không bao giờ qua query.
export const profileLinkCreateRequestSchema = z.object({}).strict().meta({ id: 'ProfileLinkCreateRequest' });
export const profileLinkCreatedSchema = z
  .object({ url: z.string(), expiresAt: z.iso.datetime() })
  .meta({ id: 'ProfileLinkCreated' });
// SPEC-004 (E14): tạo hồ sơ kèm tài khoản khác thì hồ sơ ở pending và phản hồi kèm link để tài khoản đó xác nhận.
export const createdHealthProfileSchema = healthProfileSchema
  .extend({ linkInvitation: profileLinkCreatedSchema.optional() })
  .meta({ id: 'CreatedHealthProfile' });
export const profileLinkViewSchema = z
  .object({
    profileName: z.string(),
    inviterName: z.string().nullable(),
    expiresAt: z.iso.datetime(),
    canAccept: z.boolean(),
    reason: z.enum(['account_already_linked', 'profile_already_linked', 'other_family']).nullable(),
    consentNote: z.literal('withdrawn_before').nullable(),
  })
  .meta({ id: 'ProfileLinkView' });
export const profileLinkAcceptRequestSchema = z
  .object({ decision: z.enum(['accepted', 'declined']) })
  .strict()
  .meta({ id: 'ProfileLinkAcceptRequest' });
export const profileLinkReceiptSchema = z
  .object({
    outcome: z.enum(['linked', 'declined']),
    profileId: z.uuid(),
    profileName: z.string(),
    consentStatus: z.enum(['pending', 'invited', 'declined', 'confirmed', 'withdrawn']),
  })
  .meta({ id: 'ProfileLinkReceipt' });
export type CreatedHealthProfile = z.infer<typeof createdHealthProfileSchema>;
export type ProfileLinkCreated = z.infer<typeof profileLinkCreatedSchema>;
export type ProfileLinkView = z.infer<typeof profileLinkViewSchema>;
export type ProfileLinkAcceptRequest = z.infer<typeof profileLinkAcceptRequestSchema>;
export type ProfileLinkReceipt = z.infer<typeof profileLinkReceiptSchema>;
