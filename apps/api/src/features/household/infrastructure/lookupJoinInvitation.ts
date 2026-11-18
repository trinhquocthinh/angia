import { sql } from 'drizzle-orm';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';

export async function lookupJoinInvitation(tx: Pick<FamilyScopedTx, 'execute'>, digest: string) {
  const { rows } = await tx.execute<{ id: string; family_id: string; role: 'main' | 'member' }>(
    sql`SELECT id, family_id, role FROM public.lookup_join_invitation(${digest})`,
  );
  // Đóng khi hash vô tình khớp nhiều lời mời khác nhau.
  return rows.length === 1 ? rows[0]! : null;
}
