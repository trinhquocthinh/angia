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

export const managedHouseholdInvitationsSchema = z.object({
  items: z.array(
    z.object({
      invitationId: z.uuid(),
      role: z.enum(['main', 'member']),
      own: z.boolean(),
      status: z.enum(['active', 'accepted', 'expired', 'revoked']),
      createdAt: z.iso.datetime(),
      expiresAt: z.iso.datetime(),
      secrets: z.object({ code: z.string(), link: z.url() }).nullable(),
    }),
  ),
  hasMore: z.boolean(),
});
export const listHouseholdInvitationsQuerySchema = z.object({
  offset: z.coerce.number().int().min(0).max(1000000).default(0),
});

export const currentHouseholdInvitationsSchema = z.object({
  items: z
    .array(
      z.object({
        invitationId: z.uuid(),
        role: z.enum(['main', 'member']),
        status: z.enum(['active', 'expired', 'accepted', 'revoked']),
        expiresAt: z.iso.datetime(),
        code: z.string().nullable(),
        link: z.url().nullable(),
      }),
    )
    .max(2),
});
