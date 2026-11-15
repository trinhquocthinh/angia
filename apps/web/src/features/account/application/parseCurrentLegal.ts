import { z } from 'zod';
import type { CurrentLegal } from './ports';
const documentSchema = z.object({
  id: z.uuid(),
  kind: z.enum(['terms', 'privacy']),
  version: z.string().min(1),
  publishedAt: z.iso.datetime(),
  material: z.boolean(),
  url: z
    .string()
    .refine((value) => value.startsWith('/') && !value.startsWith('//') && !/[\\\s]/.test(value)),
});
const schema = z.object({
  terms: documentSchema.extend({ kind: z.literal('terms') }),
  privacy: documentSchema.extend({ kind: z.literal('privacy') }),
});
export function parseCurrentLegal(value: unknown): CurrentLegal | null {
  const result = schema.safeParse(value);
  return result.success ? result.data : null;
}
