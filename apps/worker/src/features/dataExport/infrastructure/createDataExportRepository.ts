import type pg from 'pg';
import type { DataExportDependencies } from '../application/ports.js';
import { createExportSession } from './createExportSession.js';

export function createDataExportRepository(pool: pg.Pool): DataExportDependencies['repository'] {
  return {
    withPending: async (id, work) => {
      const client = await pool.connect();
      try {
        // Snapshot nhất quán mà không khoá tài khoản/hồ sơ suốt lúc upload (khoá tài khoản SPEC-075 không phải chờ).
        await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
        const { rows } = await client.query(
          `SELECT account_id,profile_id,status FROM data_exports WHERE id=$1 FOR UPDATE`,
          [id],
        );
        const row = rows[0];
        if (!row || row.status !== 'pending') {
          await client.query('COMMIT');
          return 'skipped';
        }
        const session = createExportSession(client, id, {
          accountId: row.account_id as string,
          profileId: row.profile_id as string | null,
        });
        const outcome = await work(session);
        await client.query('COMMIT');
        return outcome;
      } catch (error) {
        await client.query('ROLLBACK').catch(() => undefined);
        throw error;
      } finally {
        client.release();
      }
    },
  };
}
