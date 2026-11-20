import { z } from 'zod';

export const ownershipOfferRequestSchema = z.object({ targetAccountId: z.uuid() }).strict();
export const ownershipDecisionRequestSchema = z.object({ accept: z.boolean() }).strict();
export const ownershipOfferResponseSchema = z.object({
  id: z.uuid(),
  targetAccountId: z.uuid(),
  status: z.literal('pending'),
  createdAt: z.iso.datetime(),
});

export const currentOwnershipOfferResponseSchema = z.object({
  id: z.uuid(),
  status: z.literal('pending'),
  createdAt: z.iso.datetime(),
  offeredBy: z.object({ accountId: z.uuid(), displayName: z.string() }),
  target: z.object({ accountId: z.uuid(), displayName: z.string() }),
});
