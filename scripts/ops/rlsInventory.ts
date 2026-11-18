import pg from 'pg';
import { readRlsInventory } from './readRlsInventory.js';

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_OWNER_URL;
  if (!connectionString) {
    throw new Error('Thiếu cấu hình kết nối');
  }
  const client = new pg.Client({
    connectionString,
    connectionTimeoutMillis: 10_000,
    application_name: 'angia-rls-inventory',
  });
  try {
    await client.connect();
    console.log(JSON.stringify(await readRlsInventory(client), null, 2));
  } finally {
    await client.end();
  }
}

try {
  await main();
} catch {
  // Không in URL kết nối hoặc thông báo driver có thể chứa thông tin kết nối.
  console.error('Kiểm kê RLS thất bại; kiểm tra cấu hình, kết nối và quyền đọc catalog.');
  process.exitCode = 1;
}
