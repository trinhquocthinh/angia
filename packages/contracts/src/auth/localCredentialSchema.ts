import { z } from 'zod';

export const localCredentialRequestSchema = z
  .object({
    password: z.string().min(1).max(1024),
  })
  .meta({ id: 'LocalCredentialRequest' });
