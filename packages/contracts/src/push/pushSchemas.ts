import { z } from 'zod';
export const pushSubscriptionSchema = z
  .object({
    endpoint: z.string().url().max(2048),
    keys: z.object({ p256dh: z.string().max(100), auth: z.string().max(30) }).strict(),
  })
  .strict()
  .meta({ id: 'PushSubscriptionRequest' });
export const pushConfigSchema = z
  .object({
    enabled: z.boolean(),
    publicKey: z.string().nullable(),
    registered: z.boolean(),
  })
  .meta({ id: 'PushConfig' });
