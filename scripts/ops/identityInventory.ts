import { mkdir, open } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import pg from 'pg';
import { z } from 'zod';
import { readIdentityInventory } from './readIdentityInventory.js';

async function main(): Promise<void> {
  const { values } = parseArgs({ options: { force: { type: 'boolean', default: false } } });
  const connectionString = z.string().url().parse(process.env.DATABASE_OWNER_URL);
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    const mapping = await readIdentityInventory(client);
    await mkdir('ops-private', { recursive: true, mode: 0o700 });
    const path = 'ops-private/identity-mapping.json';
    // wx chống ghi đè cả khi hai lệnh kiểm kê chạy đồng thời.
    const file = await open(path, values.force ? 'w' : 'wx', 0o600);
    try {
      await file.chmod(0o600);
      await file.writeFile(`${JSON.stringify(mapping, null, 2)}\n`);
    } finally {
      await file.close();
    }
    console.log(
      `Kiểm kê: ${mapping.accounts.length} dòng OIDC, bỏ qua ${mapping.skipped.length} account không subject.`,
    );
  } finally {
    await client.end();
  }
}
try {
  await main();
} catch (error) {
  const exists = error instanceof Error && 'code' in error && error.code === 'EEXIST';
  console.error(
    'Kiểm kê danh tính thất bại:',
    exists
      ? 'Tệp mapping đã tồn tại; chỉ dùng --force khi owner muốn ghi đè.'
      : error instanceof Error
        ? error.message
        : 'Lỗi chưa xác định',
  );
  process.exitCode = 1;
}
