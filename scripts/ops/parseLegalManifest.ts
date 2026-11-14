import { z } from 'zod';

const manifest = z
  .array(
    z.object({
      kind: z.enum(['terms', 'privacy']),
      version: z.string().trim().min(1),
      publishedAt: z.iso.datetime({ offset: true }),
      material: z.boolean(),
      file: z.string().regex(/^legal\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.md$/),
    }),
  )
  .min(1)
  .refine(
    (entries) => new Set(entries.map((entry) => `${entry.kind}:${entry.version}`)).size === entries.length,
  );

export function parseLegalManifest(input: unknown) {
  return manifest.parse(input);
}
