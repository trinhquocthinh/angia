import type pg from 'pg';
import type { ExportAccount } from '../application/ports.js';

export async function readExportAccount(client: pg.PoolClient, accountId: string): Promise<ExportAccount> {
  const { rows } = await client.query(
    `SELECT id, username_normalized, display_name, email, email_verified_at,
      family_id, family_role, health_profile_id, created_at FROM accounts WHERE id = $1`,
    [accountId],
  );
  const account = rows[0];
  if (!account) throw new Error('export_account_missing');
  const acceptances = await client.query(
    `SELECT l.id, l.version_id, l.accepted_at, v.kind, v.version
      FROM legal_acceptances l JOIN legal_document_versions v ON v.id = l.version_id
      JOIN accounts a ON a.legal_ref = l.account_ref WHERE a.id = $1 ORDER BY l.accepted_at,l.id`,
    [accountId],
  );
  const { family_id: familyId, ...data } = account;
  return {
    id: account.id as string,
    familyId: familyId as string | null,
    familyRole: account.family_role as string | null,
    healthProfileId: account.health_profile_id as string | null,
    data: { ...data, legal_acceptances: acceptances.rows },
  };
}
