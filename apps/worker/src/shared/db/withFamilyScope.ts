import type pg from 'pg';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Bản worker của withFamilyScope API (Tech Spec §3): transaction + set_config('app.family_id', ..., true)
// để RLS lọc theo nhóm. familyId đến từ payload job do API ghi từ phiên của người tải lên.
export async function withFamilyScope<T>(
  pool: pg.Pool,
  familyId: string,
  work: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  if (!UUID_PATTERN.test(familyId)) throw new Error('withFamilyScope: familyId phải là UUID');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SELECT set_config('app.family_id', $1, true)`, [familyId]);
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
