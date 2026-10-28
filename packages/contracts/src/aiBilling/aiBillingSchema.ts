import { z } from 'zod';

const moneySchema = z.string().regex(/^(0|[1-9]\d*)\.\d{12}$/);
const sourceStatusSchema = z.enum([
  'unverified',
  'complete',
  'gap',
  'error',
  'counter_reset',
  'credential_changed',
  'receipt_conflict',
  'missing_credential',
]);
const sourceSchema = z.strictObject({
  id: z.uuid(),
  provider: z.literal('openrouter'),
  status: sourceStatusSchema,
  confirmedSpendUsd: moneySchema,
  lastAttemptAt: z.iso.datetime().nullable(),
  lastCompleteAt: z.iso.datetime().nullable(),
});

// Chỉ metadata phí toàn hệ thống; không trả credential, counter hoặc payload nhà cung cấp.
export const aiBillingViewSchema = z
  .strictObject({
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
    unit: z.literal('USD'),
    status: z.enum(['ready', 'incomplete', 'stale', 'unconfigured']),
    confirmedSpendUsd: moneySchema,
    actualSpendUsd: moneySchema.nullable(),
    lastSyncedAt: z.iso.datetime().nullable(),
    sources: z.array(sourceSchema),
  })
  .meta({ id: 'AiBillingView' });

export type AiBillingView = z.infer<typeof aiBillingViewSchema>;
