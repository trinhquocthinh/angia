import type pg from 'pg';
import { parseIdentityMapping } from './parseIdentityMapping.js';
import type { IdentityMapping, IdentityMappingAccount } from './parseIdentityMapping.js';
import { readIdentityMigrationSnapshot } from './readIdentityMigrationSnapshot.js';

async function applyAccount(client: pg.ClientBase, row: IdentityMappingAccount, index: number) {
  const { rows } = await client.query<{ username: string | null }>(
    `SELECT username_normalized AS username
    FROM accounts WHERE id = $1 AND oidc_subject = $2
      AND family_id IS NOT DISTINCT FROM $3::uuid
      AND family_role IS NOT DISTINCT FROM $4::text FOR UPDATE`,
    [row.accountId, row.oidcSubject, row.familyId, row.familyRole],
  );
  const current = rows[0];
  if (!current)
    throw new Error(`Dòng ${index + 1}: không tìm thấy account hoặc lệch subject/gia đình/vai trò.`);
  if (current.username === row.username) return 'unchanged';
  if (current.username !== null) throw new Error(`Dòng ${index + 1}: conflict, account đã có username khác.`);
  const occupied = await client.query('SELECT id FROM accounts WHERE username_normalized = $1 AND id <> $2', [
    row.username,
    row.accountId,
  ]);
  if (occupied.rowCount) throw new Error(`Dòng ${index + 1}: conflict, username đã thuộc account khác.`);
  const updated = await client.query(
    `UPDATE accounts SET username_normalized = $1
    WHERE id = $2 AND username_normalized IS NULL AND oidc_subject = $3
      AND family_id IS NOT DISTINCT FROM $4::uuid AND family_role IS NOT DISTINCT FROM $5::text`,
    [row.username, row.accountId, row.oidcSubject, row.familyId, row.familyRole],
  );
  if (updated.rowCount !== 1) throw new Error(`Dòng ${index + 1}: không cập nhật được account.`);
  return 'updated';
}

export async function applyIdentityMapping(
  client: pg.ClientBase,
  input: IdentityMapping,
  { apply = false }: { apply?: boolean } = {},
) {
  const mapping = parseIdentityMapping(input);
  await client.query('BEGIN');
  try {
    // Giữ số đếm/checksum nhất quán; chặn ghi đồng thời trong transaction vận hành ngắn.
    await client.query('LOCK TABLE accounts, account_credentials IN SHARE ROW EXCLUSIVE MODE');
    await client.query('SELECT id FROM accounts WHERE id = ANY($1::uuid[]) ORDER BY id FOR UPDATE', [
      mapping.accounts.map((row) => row.accountId),
    ]);
    const before = await readIdentityMigrationSnapshot(client);
    const counts = { updated: 0, unchanged: 0, deferred: 0 };
    for (const [index, row] of mapping.accounts.entries()) {
      if (row.status === 'defer') counts.deferred++;
      else counts[await applyAccount(client, row, index)]++;
    }
    const after = await readIdentityMigrationSnapshot(client);
    if (
      after.accounts !== before.accounts ||
      after.credentials !== before.credentials ||
      after.checksum !== before.checksum ||
      after.credentialsChecksum !== before.credentialsChecksum ||
      after.accountsWithUsername !== before.accountsWithUsername + counts.updated
    ) {
      throw new Error('Đối chiếu trước/sau không khớp; hủy toàn bộ chuyển đổi.');
    }
    await client.query(apply ? 'COMMIT' : 'ROLLBACK');
    return { mode: apply ? 'apply' : 'dry-run', ...counts, before, after };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
