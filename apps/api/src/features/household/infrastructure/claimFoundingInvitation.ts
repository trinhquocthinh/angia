import { createHash } from 'node:crypto';
import { sql } from 'drizzle-orm';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';

// Token thô chỉ tồn tại trong request; không ghi log, audit hoặc trả về client.
export async function claimFoundingInvitation(
  tx: FamilyScopedTx,
  token: string,
  accountId: string,
): Promise<boolean> {
  const hash = createHash('sha256').update(token).digest('hex');
  const { rows } = await tx.execute<{ id: string }>(
    sql`SELECT id FROM public.lookup_founding_invitation(${hash})`,
  );
  if (rows.length !== 1) return false;
  const claimed = await tx.execute<{ accepted: boolean }>(
    sql`SELECT public.accept_founding_invitation(${hash}, ${accountId}::uuid) AS accepted`,
  );
  return claimed.rows[0]?.accepted === true;
}
