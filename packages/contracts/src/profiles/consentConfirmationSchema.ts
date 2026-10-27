import { z } from 'zod';

export const consentConfirmationSchema = z
  .discriminatedUnion('kind', [
    z.object({
      kind: z.literal('attestation'),
      attestation: z.literal(true),
      basis: z.enum(['self', 'guardian']),
      respondentName: z.string().trim().normalize('NFC').min(1).max(60),
    }),
    z.object({ kind: z.literal('self') }),
  ])
  .meta({ id: 'ConsentConfirmation' });
export type ConsentConfirmation = z.infer<typeof consentConfirmationSchema>;
