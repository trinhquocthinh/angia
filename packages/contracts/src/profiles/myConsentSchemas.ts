import { z } from 'zod';

// SPEC-036: trạng thái đồng thuận của hồ sơ gắn với tài khoản phiên; không chứa dữ liệu sức khỏe.
export const myConsentSchema = z
  .object({
    profile: z
      .object({
        id: z.uuid(),
        displayName: z.string(),
        consentStatus: z.enum(['pending', 'invited', 'declined', 'confirmed', 'withdrawn']),
        withdrawnAt: z.iso.datetime().nullable(),
      })
      .nullable(),
  })
  .meta({ id: 'MyConsent' });
export type MyConsent = z.infer<typeof myConsentSchema>;

// SPEC-036: kết quả rút đồng thuận.
export const myConsentWithdrawnSchema = z
  .object({ consentStatus: z.literal('withdrawn'), withdrawnAt: z.iso.datetime() })
  .meta({ id: 'MyConsentWithdrawn' });
export type MyConsentWithdrawn = z.infer<typeof myConsentWithdrawnSchema>;
