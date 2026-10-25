import { PgBoss } from 'pg-boss';
import type { Logger } from 'pino';

// API chỉ gửi job: tắt supervise/schedule (worker đảm nhiệm bảo trì hàng đợi). Schema `pgboss` do
// migration role owner tạo (0004_pgboss_schema, Nợ #11) nên role app chạy với migrate/createSchema tắt.
export function createPgBoss(connectionString: string, logger: Logger): PgBoss {
  const boss = new PgBoss({
    connectionString,
    migrate: false,
    createSchema: false,
    supervise: false,
    schedule: false,
    max: 2,
  });
  boss.on('error', (error) => logger.error({ reason: error.message }, 'pg-boss lỗi'));
  return boss;
}
