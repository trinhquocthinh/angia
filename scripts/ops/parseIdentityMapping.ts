import { z } from 'zod';

const uuid = z.uuid().transform((value) => value.toLowerCase());
const accountSchema = z
  .object({
    accountId: uuid,
    oidcSubject: z.string(),
    familyId: uuid.nullable(),
    familyRole: z.enum(['main', 'member']).nullable(),
    isSystemAdmin: z.boolean(),
    displayName: z.string(),
    currentUsername: z.string().nullable(),
    hasCredential: z.boolean(),
    username: z.string(),
    status: z.enum(['migrate', 'defer']),
  })
  .strict();
const mappingSchema = z
  .object({
    format: z.literal('angia-identity-mapping/1'),
    generatedAt: z.iso.datetime({ offset: true }),
    accounts: z.array(accountSchema),
    skipped: z.array(z.object({ accountId: uuid, reason: z.literal('no_oidc_subject') }).strict()),
  })
  .strict();
export type IdentityMapping = z.infer<typeof mappingSchema>;
export type IdentityMappingAccount = IdentityMapping['accounts'][number];

export function parseIdentityMapping(input: unknown): IdentityMapping {
  const result = mappingSchema.safeParse(input);
  if (!result.success) {
    const issue = result.error.issues[0];
    const index = issue?.path[1];
    const location = typeof index === 'number' ? `Dòng ${index + 1} (${String(issue?.path[0])})` : 'Mapping';
    throw new Error(`${location}: định dạng hoặc trường dữ liệu không hợp lệ.`);
  }
  const mapping = result.data;
  const ids = new Set<string>();
  const usernames = new Set<string>();
  for (const [index, row] of mapping.accounts.entries()) {
    if (ids.has(row.accountId)) throw new Error(`Dòng ${index + 1}: accountId trùng lặp.`);
    ids.add(row.accountId);
    if (row.status === 'migrate' && !/^[a-z0-9._-]{3,32}$/.test(row.username)) {
      throw new Error(`Dòng ${index + 1}: định dạng username không hợp lệ.`);
    }
    if (row.username !== '' && usernames.has(row.username)) {
      throw new Error(`Dòng ${index + 1}: username trùng lặp.`);
    }
    if (row.username !== '') usernames.add(row.username);
  }
  for (const [index, row] of mapping.skipped.entries()) {
    if (ids.has(row.accountId)) throw new Error(`Dòng ${index + 1} (skipped): accountId trùng lặp.`);
    ids.add(row.accountId);
  }
  return mapping;
}
