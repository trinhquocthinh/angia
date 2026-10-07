import { z } from 'zod';

export const consentInvitationCreatedSchema = z
  .object({ token: z.string(), expiresAt: z.iso.datetime() })
  .meta({ id: 'ConsentInvitationCreated' });
export const consentInvitationRevokedSchema = z
  .object({ status: z.literal('pending') })
  .meta({ id: 'ConsentInvitationRevoked' });
export const consentInvitationViewSchema = z
  .object({
    profileDisplayName: z.string(),
    inviterDisplayName: z.string().nullable(),
    expiresAt: z.iso.datetime(),
    status: z.enum(['pending', 'accepted', 'declined']),
  })
  .meta({ id: 'ConsentInvitationView' });
export const consentInvitationRespondRequestSchema = z
  .object({
    respondentName: z.string().trim().min(1).max(60),
    basis: z.enum(['self', 'guardian']),
    decision: z.enum(['accepted', 'declined']),
  })
  .strict()
  .meta({ id: 'ConsentInvitationRespondRequest' });
export const consentInvitationReceiptSchema = z
  .object({
    outcome: z.enum(['recorded', 'already_responded']),
    decision: z.enum(['accepted', 'declined']),
    respondentName: z.string(),
    basis: z.enum(['self', 'guardian']),
    respondedAt: z.iso.datetime(),
  })
  .meta({ id: 'ConsentInvitationReceipt' });
export type ConsentInvitationCreated = z.infer<typeof consentInvitationCreatedSchema>;
export type ConsentInvitationView = z.infer<typeof consentInvitationViewSchema>;
export type ConsentInvitationRespondRequest = z.infer<typeof consentInvitationRespondRequestSchema>;
export type ConsentInvitationReceipt = z.infer<typeof consentInvitationReceiptSchema>;
