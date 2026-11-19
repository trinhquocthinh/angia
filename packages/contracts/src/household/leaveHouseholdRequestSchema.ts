import { z } from 'zod';

export const leaveHouseholdRequestSchema = z.strictObject({
  ownProfileDisposition: z.enum(['keep', 'delete']).optional(),
});
