import { z } from 'zod';

export const linkableAccountSchema = z
  .object({ id: z.uuid(), displayName: z.string() })
  .meta({ id: 'LinkableAccount' });
export type LinkableAccount = z.infer<typeof linkableAccountSchema>;
