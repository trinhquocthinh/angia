import { z } from 'zod';

export const revisitQuerySchema = z.object({ from: z.iso.date().optional() });
export const setRevisitDateSchema = z
  .object({ revisitDate: z.iso.date().nullable() })
  .meta({ id: 'SetRevisitDate' });
export const revisitListSchema = z
  .array(
    z.object({
      revisitDate: z.iso.date(),
      prescriptions: z.array(
        z.object({ id: z.uuid(), issuedDate: z.iso.date(), facility: z.string().nullable() }),
      ),
    }),
  )
  .meta({ id: 'RevisitList' });
export type RevisitList = z.infer<typeof revisitListSchema>;
