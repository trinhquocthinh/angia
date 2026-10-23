import type pg from 'pg';
import type { FamilyAccount } from '@src/shared/domain/FamilyAccount.js';

// Tài khoản hiện còn trong gia đình (BR-039); accounts không áp RLS nên lọc family_id tường minh.
export async function queryFamilyAccounts(client: pg.PoolClient, familyId: string): Promise<FamilyAccount[]> {
  const { rows } = await client.query<FamilyAccount>(
    `SELECT id, family_role AS role, health_profile_id AS "healthProfileId"
       FROM accounts WHERE family_id = $1 AND family_role IS NOT NULL`,
    [familyId],
  );
  return rows;
}
