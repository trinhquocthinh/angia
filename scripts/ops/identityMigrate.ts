import { parseArgs } from 'node:util';
import pg from 'pg';
import { z } from 'zod';
import { applyIdentityMapping } from './applyIdentityMapping.js';
import { readIdentityMappingFile } from './readIdentityMappingFile.js';

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
    const result = await applyIdentityMapping(client, mapping, { apply: values.apply });
    console.log(
      `Chuyển danh tính: mode=${result.mode}, cập nhật ${result.updated}, đã đúng ${result.unchanged}, hoãn ${result.deferred}.`,
    );
    console.log(`Số đếm trước/sau: ${JSON.stringify({ before: result.before, after: result.after })}`);
  } finally {
    await client.end();
  }
}
try {
  await main();
} catch (error) {
  console.error('Chuyển danh tính thất bại:', error instanceof Error ? error.message : 'Lỗi chưa xác định');
  process.exitCode = 1;
}
