import type pg from 'pg';
import { parseIdentityMapping } from './parseIdentityMapping.js';
import type { IdentityMapping } from './parseIdentityMapping.js';

export async function reconcileIdentityMapping(client: pg.ClientBase, input: IdentityMapping) {
  const mapping = parseIdentityMapping(input);
  await client.query('BEGIN READ ONLY');
  try {
    const { rows } = await client.query<{ id: string; username: string | null; hasCredential: boolean }>(
      `SELECT a.id, a.username_normalized AS username,
        EXISTS (SELECT 1 FROM account_credentials c WHERE c.account_id = a.id) AS "hasCredential"
       FROM accounts a WHERE a.oidc_subject IS NOT NULL OR a.id = ANY($1::uuid[]) ORDER BY a.id`,
      [mapping.accounts.map((row) => row.accountId)],
    );
    const accounts = new Map(rows.map((row) => [row.id, row]));
    const mappedIds = new Set(mapping.accounts.map((row) => row.accountId));
    const report = {
      migrated: 0,
      missingUsername: [] as string[],
      usernameMismatch: [] as string[],
      missingCredential: [] as string[],
      unmapped: rows.filter((row) => !mappedIds.has(row.id)).map((row) => row.id),
      missingAccount: [] as string[],
      deferred: [] as string[],
      complete: false,
    };
    for (const row of mapping.accounts) {
      if (row.status === 'defer') {
        report.deferred.push(row.accountId);
        continue;
      }
      const account = accounts.get(row.accountId);
      if (!account) {
        report.missingAccount.push(row.accountId);
        continue;
      }
      if (account.username === null) report.missingUsername.push(row.accountId);
      else if (account.username !== row.username) report.usernameMismatch.push(row.accountId);
      if (!account.hasCredential) report.missingCredential.push(row.accountId);
      if (account.username === row.username && account.hasCredential) report.migrated++;
    }
    report.complete =
      report.missingUsername.length === 0 &&
      report.usernameMismatch.length === 0 &&
      report.missingCredential.length === 0 &&
      report.unmapped.length === 0 &&
      report.missingAccount.length === 0;
    await client.query('COMMIT');
    return report;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
