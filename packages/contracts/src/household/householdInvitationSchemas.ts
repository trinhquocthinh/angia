import { z } from 'zod';

export const createHouseholdInvitationRequestSchema = z.strictObject({
  kind: z.literal('join_family'),
  role: z.enum(['main', 'member']),
});

export const householdInvitationResponseSchema = z.object({
  invitationId: z.uuid(),
  link: z.url(),
  code: z.string(),
  expiresAt: z.iso.datetime(),
});

export { acceptHouseholdInvitationRequestSchema } from './acceptHouseholdInvitationRequestSchema.js';
export { createFoundingInvitationRequestSchema } from './createFoundingInvitationRequestSchema.js';
