import type pg from 'pg';
import type { IdentityMapping, IdentityMappingAccount } from './parseIdentityMapping.js';

type InventoryRow = Omit<IdentityMappingAccount, 'oidcSubject' | 'username' | 'status'> & {
  oidcSubject: string | null;
};

export async function readIdentityInventory(client: pg.ClientBase): Promise<IdentityMapping> {
  await client.query('BEGIN READ ONLY');
  try {
    const { rows } = await client.query<InventoryRow>(`SELECT a.id AS "accountId",
      a.oidc_subject AS "oidcSubject", a.family_id AS "familyId", a.family_role AS "familyRole",
      a.is_system_admin AS "isSystemAdmin", a.display_name AS "displayName",
      a.username_normalized AS "currentUsername",
      EXISTS (SELECT 1 FROM account_credentials c WHERE c.account_id = a.id) AS "hasCredential"
      FROM accounts a ORDER BY a.family_id, a.family_role, a.id`);
    const mapping: IdentityMapping = {
      format: 'angia-identity-mapping/1',
      generatedAt: new Date().toISOString(),
      accounts: [],
      skipped: [],
    };
    for (const row of rows) {
      if (row.oidcSubject === null) {
        mapping.skipped.push({ accountId: row.accountId, reason: 'no_oidc_subject' });
      } else {
        mapping.accounts.push({
          ...row,
          oidcSubject: row.oidcSubject,
          username: row.currentUsername ?? '',
          status: 'migrate',
        });
      }
    }
    await client.query('COMMIT');
    return mapping;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
