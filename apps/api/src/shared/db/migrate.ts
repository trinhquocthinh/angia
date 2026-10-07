import { loadMigrateConfig } from '@src/shared/config/loadMigrateConfig.js';
import { describeMigrationResult } from './describeMigrationResult.js';
import { runMigrations } from './runMigrations.js';

// Điểm vào `yarn db:migrate` (dev) và container angia-migrate (SIT/Prod, dùng lại image api).
try {
  const { DATABASE_OWNER_URL } = loadMigrateConfig(process.env);
  const applied = await runMigrations(DATABASE_OWNER_URL);
  console.log(describeMigrationResult(applied));
} catch (error) {
  console.error('Migration thất bại:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
