import pg from 'pg';
import { createDatabase } from '../../apps/api/src/shared/db/createDatabase.js';
import { loadReminderSeedOptions } from './loadReminderSeedOptions.js';
import { seedReminderFamily } from './seedReminderFamily.js';
import { readReminderSeedActors } from './readReminderSeedActors.js';

async function main() {
  const options = loadReminderSeedOptions(process.env, process.argv.slice(2));
  const pool = new pg.Pool({ connectionString: options.connectionString });
  try {
    const db = createDatabase(pool);
    const reports = await db.transaction(async (tx) => {
      const actors = await readReminderSeedActors(tx, options.usernames);
      const now = new Date();
      const date = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(now);
      const results = [];
      for (const familyId of new Set(actors.map((actor) => actor.familyId!))) {
        results.push(
          await seedReminderFamily(
            tx,
            familyId,
            actors.filter((a) => a.familyId === familyId),
            now,
            date,
          ),
        );
      }
      return results;
    });
    console.log(JSON.stringify(reports, null, 2));
    console.log('Seed UI nhắc thuốc đã hoàn tất. Chỉ thêm dữ liệu mẫu còn thiếu.');
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  const cause = error instanceof Error ? error.cause : null;
  const code = cause && typeof cause === 'object' && 'code' in cause ? String(cause.code) : '';
  console.error('Seed thất bại; transaction đã rollback.', code || 'Kiểm tra DB dev, role app và tài khoản.');
  process.exitCode = 1;
});
