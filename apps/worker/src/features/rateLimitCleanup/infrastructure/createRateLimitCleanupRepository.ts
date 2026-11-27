import type pg from 'pg';
import type { RateLimitCleanupRepository } from '../application/ports.js';

// Bucket chỉ chứa khoá đã băm, không chứa dữ liệu sức khoẻ, dùng kết nối role app ngoài phạm vi nhà.
export function createRateLimitCleanupRepository(pool: pg.Pool): RateLimitCleanupRepository {
  return {
    async removeExpired() {
      const result = await pool.query(
        "DELETE FROM rate_limit_buckets WHERE window_start < now() - interval '1 day'",
      );
      return result.rowCount ?? 0;
    },
  };
}
