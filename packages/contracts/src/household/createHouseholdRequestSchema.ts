import { z } from 'zod';

export const createHouseholdRequestSchema = z
  .strictObject({
    name: z.string().trim().min(1).max(60),
    invitationToken: z.string().min(1).optional(),
  })
  .meta({ id: 'CreateHouseholdRequest' });

export type CreateHouseholdRequest = z.infer<typeof createHouseholdRequestSchema>;
