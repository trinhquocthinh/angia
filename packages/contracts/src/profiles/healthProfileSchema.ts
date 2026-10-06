import { z } from 'zod';

export const healthProfileSchema = z
  .object({
    id: z.uuid(),
    familyId: z.uuid(),
    displayName: z.string(),
    birthYear: z.number().int().nullable(),
    consentConfirmedAt: z.iso.datetime().nullable(),
    consentConfirmedBy: z.uuid().nullable(),
    consentBasis: z.enum(['self', 'guardian']).nullable(),
    consentStatus: z.enum(['pending', 'invited', 'declined', 'confirmed']),
    consentSource: z.enum(['legacy_attestation', 'invitation']).nullable(),
    consentRespondentName: z.string().nullable(),
    createdAt: z.iso.datetime(),
  })
  .meta({ id: 'HealthProfile' });
export type HealthProfile = z.infer<typeof healthProfileSchema>;
