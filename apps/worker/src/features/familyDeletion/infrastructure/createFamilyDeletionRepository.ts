import type pg from 'pg';
import type { PgBoss } from 'pg-boss';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { FamilyDeletionRepository } from '../application/ports.js';
import { createFamilyDeletionStore } from './createFamilyDeletionStore.js';
import { enterFamilyDeletionRole } from './resolveFamilyDeletionRole.js';

// Mỗi lượt chỉ xử lý tối đa DUE_BATCH nhà (đến hạn sớm nhất trước); phần còn lại để lượt 5 phút sau.
const DUE_BATCH = 20;

// Quét bằng role xoá nhà: policy chỉ cho thấy yêu cầu pending đã đến hạn (TC-869), không cần GUC nhà.
// Mỗi nhà một transaction riêng; lock + kiểm tra + xoá trong createFamilyDeletionStore.
export function createFamilyDeletionRepository(pool: pg.Pool, boss: PgBoss): FamilyDeletionRepository {
  return {
    listDueFamilyIds: async () => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await enterFamilyDeletionRole(client);
        const due = await client.query<{ family_id: string }>(
          `SELECT family_id FROM family_deletion_requests WHERE status='pending' AND execute_at<=now()
           GROUP BY family_id ORDER BY min(execute_at), family_id LIMIT ${DUE_BATCH}`,
        );
        await client.query('COMMIT');
        return due.rows.map((row) => row.family_id);
      } catch (error) {
        await client.query('ROLLBACK').catch(() => undefined);
        throw error;
      } finally {
        client.release();
      }
    },
    withFamily: (familyId, work) =>
      withFamilyScope(pool, familyId, (client) => work(createFamilyDeletionStore(client, familyId, boss))),
  };
}
