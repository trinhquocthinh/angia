import { parseArgs } from 'node:util';
import { z } from 'zod';

const optionsSchema = z.object({
  'spent-minutes': z.string().trim().min(1).pipe(z.coerce.number<string>().finite().min(0).max(360)),
  origin: z.string().trim().min(1).max(128),
});

export function loadIdentityMeasurementOptions(args: string[]) {
  try {
    const { values } = parseArgs({
      args,
      options: { 'spent-minutes': { type: 'string' }, origin: { type: 'string' } },
    });
    const parsed = optionsSchema.safeParse(values);
    if (!parsed.success) throw new Error('idp_invalid_measurement_options');
    return { spentMinutes: parsed.data['spent-minutes'], origin: parsed.data.origin };
  } catch {
    throw new Error('idp_invalid_measurement_options');
  }
}
