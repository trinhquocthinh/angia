import type pg from 'pg';

// Migration 0051 cho role app SET vào đúng một role tải về, không INHERIT quyền đọc nhà cũ.
export async function enterDataExportRole(client: pg.PoolClient, accountId: string): Promise<void> {
  const { rows } = await client.query<{ rolname: string }>(
    `SELECT r.rolname FROM pg_auth_members m JOIN pg_roles r ON r.oid = m.roleid
     WHERE m.member = (SELECT oid FROM pg_roles WHERE rolname = current_user)
       AND m.set_option AND r.rolname LIKE '%\\_data\\_export'`,
  );
  if (rows.length !== 1) throw new Error('data_export_role_missing');
  await client.query(`SELECT set_config('app.export_account_id', $1, true)`, [accountId]);
  await client.query(`SET LOCAL ROLE ${client.escapeIdentifier(rows[0]!.rolname)}`);
}

export async function leaveDataExportRole(client: pg.PoolClient): Promise<void> {
  await client.query('RESET ROLE');
  await client.query(`SELECT set_config('app.export_account_id', '', true)`);
}
