import type pg from 'pg';
import type { IdentityMapping } from './parseIdentityMapping.js';
import { rollbackIdentityUsernames } from './rollbackIdentityUsernames.js';

export async function runIdentityRollback(
  client: pg.ClientBase,
  mapping: IdentityMapping,
  { apply }: { apply: boolean },
): Promise<{ mode: 'apply' | 'dry-run'; updated: number }> {
  await client.query('BEGIN');
  try {
    const { updated } = await rollbackIdentityUsernames(client, mapping);
    await client.query(apply ? 'COMMIT' : 'ROLLBACK');
    return { mode: apply ? 'apply' : 'dry-run', updated };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
