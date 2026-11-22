import type pg from 'pg';
import type { CleanupDataExportsRepository } from '../application/ports.js';

// data_exports thuộc tài khoản, không có RLS theo nhà; dùng kết nối role app.
export function createCleanupDataExportsRepository(pool: pg.Pool): CleanupDataExportsRepository {
  return {
    async *expired(): AsyncIterable<{ id: string; objectKey: string }> {
      let after: string | null = null;
      for (;;) {
        const { rows }: pg.QueryResult<{ id: string; object_key: string }> = await pool.query(
          `SELECT id,object_key FROM data_exports WHERE status='ready' AND expires_at <= now()
           AND ($1::uuid IS NULL OR id > $1) ORDER BY id LIMIT 100`,
          [after],
        );
        if (!rows.length) return;
        for (const row of rows) yield { id: row.id, objectKey: row.object_key };
        after = rows.at(-1)!.id;
      }
    },
    removeExpired: async (id) => {
      const result = await pool.query(
        `DELETE FROM data_exports WHERE id=$1 AND status='ready' AND expires_at <= now()`,
        [id],
      );
      return (result.rowCount ?? 0) > 0;
    },
    expireStale: async () => {
      const failed = await pool.query(
        `DELETE FROM data_exports WHERE status='failed' AND created_at <= now()-interval '24 hours'`,
      );
      const pending = await pool.query(
        `UPDATE data_exports SET status='failed'
         WHERE status='pending' AND created_at <= now()-interval '24 hours'`,
      );
      return { pendingFailed: pending.rowCount ?? 0, failedRemoved: failed.rowCount ?? 0 };
    },
    isActive: async (id) => {
      const { rows } = await pool.query<{ active: boolean }>(
        `SELECT EXISTS(SELECT 1 FROM data_exports WHERE id=$1 AND
         ((status='ready' AND expires_at > now()) OR
          (status='pending' AND created_at > now()-interval '24 hours'))) AS active`,
        [id],
      );
      return rows[0]?.active === true;
    },
  };
}
