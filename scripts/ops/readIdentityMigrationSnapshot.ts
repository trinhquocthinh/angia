import type pg from 'pg';

export interface IdentityMigrationSnapshot {
  accounts: number;
  credentials: number;
  accountsWithUsername: number;
  checksum: string;
  credentialsChecksum: string;
}

export async function readIdentityMigrationSnapshot(client: pg.ClientBase) {
  const { rows } = await client.query<IdentityMigrationSnapshot>(`SELECT
    count(*)::integer AS accounts,
    (SELECT count(*)::integer FROM account_credentials) AS credentials,
    count(a.username_normalized)::integer AS "accountsWithUsername",
    md5(COALESCE(string_agg((to_jsonb(a) - 'username_normalized')::text,
      E'\\n' ORDER BY a.id), '')) AS checksum,
    (SELECT md5(COALESCE(string_agg(to_jsonb(c)::text, E'\\n' ORDER BY c.account_id), ''))
      FROM account_credentials c) AS "credentialsChecksum"
    FROM accounts a`);
  return rows[0]!;
}
