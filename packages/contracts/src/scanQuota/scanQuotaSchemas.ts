import { z } from 'zod';
const month = z.string().regex(/^[0-9]{4}-(0[1-9]|1[0-2])$/);
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const integer = z.string().regex(/^(0|[1-9][0-9]*)$/);
const money = z.string().regex(/^(0|[1-9][0-9]*)\.[0-9]{12}$/);
export const scanQuotaPolicySchema = z
  .strictObject({
    estimatedCostPerScanUsd: z
      .string()
      .max(41)
      .regex(/^(0|[1-9][0-9]{0,27})(\.[0-9]{1,12})?$/)
      .refine((value) => /[1-9]/.test(value)),
    reserveBasisPoints: z.number().int().min(0).max(10000),
    trialScans: count,
  })
  .meta({ id: 'ScanQuotaPolicy' });
export const familyScanQuotaSchema = z
  .strictObject({
    month,
    status: z.enum(['unconfigured', 'trial', 'approved']),
    grantedScans: count,
    usedScans: count,
    heldScans: count,
    remainingScans: count,
    runtimeActive: z.literal(true),
  })
  .meta({ id: 'FamilyScanQuota' });
export const adminScanQuotaViewSchema = z
  .strictObject({
    month,
    version: count,
    policy: scanQuotaPolicySchema.nullable(),
    monthlyCapUsd: money,
    actualSpendUsd: money.nullable(),
    billingStatus: z.enum(['ready', 'incomplete', 'stale', 'unconfigured']),
    committedRemainingScans: integer,
    availableAdditionalScans: integer.nullable(),
    overAllocatedScans: integer.nullable(),
    families: z.array(
      z.strictObject({
        familyId: z.uuid(),
        familyName: z.string(),
        quota: familyScanQuotaSchema,
        previousApprovedScans: count.nullable(),
      }),
    ),
    runtimeActive: z.literal(true),
  })
  .meta({ id: 'AdminScanQuotaView' });
export const updateScanQuotaPolicyRequestSchema = z
  .strictObject({ month, expectedVersion: count, policy: scanQuotaPolicySchema })
  .meta({ id: 'UpdateScanQuotaPolicyRequest' });
export const grantScanQuotasRequestSchema = z
  .strictObject({
    month,
    expectedVersion: count,
    grants: z
      .array(
        z.strictObject({
          familyId: z.uuid(),
          status: z.literal('approved'),
          grantedScans: count,
          reason: z.string().trim().min(1).max(500),
        }),
      )
      .min(1)
      .max(100),
  })
  .refine(
    (value) =>
      new Set(value.grants.map((grant) => grant.familyId.toLowerCase())).size === value.grants.length,
    {
      path: ['grants'],
      message: 'Mỗi gia đình chỉ xuất hiện một lần.',
    },
  )
  .meta({ id: 'GrantScanQuotasRequest' });
export type ScanQuotaPolicy = z.infer<typeof scanQuotaPolicySchema>;
export type FamilyScanQuota = z.infer<typeof familyScanQuotaSchema>;
export type AdminScanQuotaView = z.infer<typeof adminScanQuotaViewSchema>;
export type UpdateScanQuotaPolicyRequest = z.infer<typeof updateScanQuotaPolicyRequestSchema>;
export type GrantScanQuotasRequest = z.infer<typeof grantScanQuotasRequestSchema>;
