import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { BillingSource } from '../application/ports.js';
const schema = z
  .array(
    z
      .object({
        id: z.uuid(),
        provider: z.literal('openrouter'),
        apiKey: z.string().trim().min(1).max(4096),
      })
      .strict(),
  )
  .max(100);
export function credentialFingerprint(source: BillingSource): string {
  return createHash('sha256').update(`${source.provider}\0${source.apiKey}`).digest('hex');
}
export function parseBillingSources(json: string): BillingSource[] {
  try {
    const sources = schema.parse(JSON.parse(json));
    if (
      new Set(sources.map((s) => s.id)).size !== sources.length ||
      new Set(sources.map(credentialFingerprint)).size !== sources.length
    )
      throw new Error();
    return sources;
  } catch {
    throw new Error('billing_sources_invalid');
  }
}
