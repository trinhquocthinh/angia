import type pg from 'pg';

// Dùng trong transaction đã mở; savepoint giữ tính nguyên tử của lượt IdP nhiều account.
export async function withClientFamilyScope<T>(
  client: pg.PoolClient,
  familyId: string,
  work: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  await client.query('SAVEPOINT family_scope');
  try {
    const { rows } = await client.query("SELECT current_setting('app.family_id', true) AS previous");
    await client.query("SELECT set_config('app.family_id', $1, true)", [familyId]);
    const result = await work(client);
    await client.query("SELECT set_config('app.family_id', $1, true)", [rows[0]?.previous ?? '']);
    await client.query('RELEASE SAVEPOINT family_scope');
    return result;
  } catch (error) {
    await client.query('ROLLBACK TO SAVEPOINT family_scope');
    await client.query('RELEASE SAVEPOINT family_scope');
    throw error;
  }
}
