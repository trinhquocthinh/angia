import pg from 'pg';
import type { Logger } from 'pino';

export function createPool(connectionString: string, logger: Logger): pg.Pool {
  const pool = new pg.Pool({ connectionString, max: 10, connectionTimeoutMillis: 2_000 });
  // Client rảnh bị ngắt khi DB khởi động lại: phải bắt lỗi, nếu không tiến trình sẽ sập.
  // Chỉ log mã và thông điệp: object lỗi của pg kèm toàn bộ client (thông số kết nối).
  pool.on('error', (error: Error & { code?: string }) =>
    logger.warn({ code: error.code, reason: error.message }, 'Kết nối PostgreSQL rảnh bị ngắt'),
  );
  return pool;
}
