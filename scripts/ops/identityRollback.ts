import { parseArgs } from 'node:util';
import pg from 'pg';
import { z } from 'zod';
import { readIdentityMappingFile } from './readIdentityMappingFile.js';
import { runIdentityRollback } from './runIdentityRollback.js';

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    options: { apply: { type: 'boolean', default: false } },
    allowPositionals: true,
  });
  if (positionals.length > 1) throw new Error('Chỉ nhận một đường dẫn mapping.');
  const mapping = await readIdentityMappingFile(positionals[0] ?? 'ops-private/identity-mapping.json');
  const connectionString = z.string().url().parse(process.env.DATABASE_OWNER_URL);
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    const result = await runIdentityRollback(client, mapping, { apply: values.apply });
    console.log(`Hoàn tác username: mode=${result.mode}, cập nhật ${result.updated}.`);
  } finally {
    await client.end();
  }
}
try {
  await main();
} catch {
  // Lỗi PostgreSQL có thể chứa username, accountId hoặc URL kết nối riêng tư.
  console.error('Hoàn tác username thất bại. Kiểm tra tham số, mapping và kết nối cơ sở dữ liệu.');
  process.exitCode = 1;
}
