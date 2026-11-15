import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { z } from 'zod';
import { readLegalManifest } from './readLegalManifest.js';
import { insertLegalDocuments } from './insertLegalDocuments.js';

// Tác vụ owner giống migrate; không đọc/sửa .env và không dùng role app để seed.
async function main(): Promise<void> {
  const connectionString = z.string().url().parse(process.env.DATABASE_OWNER_URL);
  const documents = await readLegalManifest(fileURLToPath(new URL('../../', import.meta.url)));
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    const { inserted, existing } = await insertLegalDocuments(client, documents);
    console.log(`Văn bản pháp lý: thêm mới ${inserted}, đã có ${existing}.`);
  } finally {
    await client.end();
  }
}

try {
  await main();
} catch (error) {
  console.error(
    'Seed văn bản pháp lý thất bại:',
    error instanceof Error ? error.message : 'Lỗi chưa xác định',
  );
  process.exitCode = 1;
}
