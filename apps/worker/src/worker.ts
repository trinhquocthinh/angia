import pg from 'pg';
import { pino } from 'pino';
import { loadWorkerConfig } from '@src/shared/config/loadWorkerConfig.js';

// Composition root của worker. E0 chỉ xác nhận kết nối bằng role runtime;
// pg-boss và job `extract-document` bổ sung tại E2-S5-T2, khi schema `pgboss`
// được tạo qua migration bằng role owner (role app NOBYPASSRLS không có quyền CREATE).
const config = loadWorkerConfig(process.env);
const logger = pino({ level: config.LOG_LEVEL, base: { service: 'angia-worker', stack: config.STACK } });

const client = new pg.Client({ connectionString: config.DATABASE_URL, connectionTimeoutMillis: 5_000 });
try {
  await client.connect();
  await client.query('SELECT 1');
  logger.info('Worker kết nối DB thành công — chưa có job nào được đăng ký');
} catch (error) {
  logger.error({ reason: (error as Error).message }, 'Worker không kết nối được DB');
  process.exitCode = 1;
} finally {
  await client.end();
}
