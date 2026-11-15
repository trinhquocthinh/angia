import type pg from 'pg';
import type { IdentityMapping } from './parseIdentityMapping.js';

// Chỉ hoàn tác username do mapping đã duyệt thêm vào, khi chưa có credential.
export async function rollbackIdentityUsernames(client: pg.ClientBase, mapping: IdentityMapping) {
  const accounts = mapping.accounts.filter((row) => row.status === 'migrate' && row.currentUsername === null);
  const result = await client.query(
    'UPDATE accounts a SET username_normalized = NULL FROM unnest($1::uuid[], $2::text[]) AS m(id, username) WHERE a.id = m.id AND a.username_normalized = m.username AND NOT EXISTS (SELECT 1 FROM account_credentials c WHERE c.account_id = a.id)',
    [accounts.map((row) => row.accountId), accounts.map((row) => row.username)],
  );
  return { updated: result.rowCount ?? 0 };
}
