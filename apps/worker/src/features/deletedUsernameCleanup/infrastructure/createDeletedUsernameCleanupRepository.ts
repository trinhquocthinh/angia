import type pg from 'pg';
import type { DeletedUsernameCleanupRepository } from '../application/ports.js';

// Tên đã băm không chứa dữ liệu sức khoẻ, dùng kết nối role app ngoài phạm vi nhà.
export function createDeletedUsernameCleanupRepository(pool: pg.Pool): DeletedUsernameCleanupRepository {
  return {
    async removeExpired() {
      const result = await pool.query(
        "DELETE FROM deleted_usernames WHERE deleted_at <= now() - interval '90 days'",
      );
      return result.rowCount ?? 0;
    },
  };
}
