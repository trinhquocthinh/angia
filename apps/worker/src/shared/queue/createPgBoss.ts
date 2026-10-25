import { PgBoss } from 'pg-boss';
import type { Logger } from 'pino';

// Schema `pgboss` do migration role owner tạo (0004_pgboss_schema, Nợ #11): role app NOBYPASSRLS
// chỉ có DML nên tắt migrate/createSchema. Phiên bản schema lệch pg-boss thì start() báo lỗi.
export function createPgBoss(connectionString: string, logger: Logger): PgBoss {
  const boss = new PgBoss({ connectionString, migrate: false, createSchema: false, max: 4 });
  boss.on('error', (error) => logger.error({ reason: error.message }, 'pg-boss lỗi'));
  return boss;
}
