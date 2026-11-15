import { parseArgs } from 'node:util';
import pg from 'pg';
import { z } from 'zod';
import { reconcileIdentityMapping } from './reconcileIdentityMapping.js';
import { readIdentityMappingFile } from './readIdentityMappingFile.js';

async function main(): Promise<void> {
  const { positionals } = parseArgs({ allowPositionals: true });
  if (positionals.length > 1) throw new Error('Chỉ nhận một đường dẫn mapping.');
  const mapping = await readIdentityMappingFile(positionals[0] ?? 'ops-private/identity-mapping.json');
  const connectionString = z.string().url().parse(process.env.DATABASE_OWNER_URL);
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    const report = await reconcileIdentityMapping(client, mapping);
    console.log(`Đối chiếu danh tính: ${JSON.stringify(report)}`);
    console.log(`Account OIDC ngoài mapping (unmapped): ${JSON.stringify(report.unmapped)}`);
    console.log(
      `Account migrate không còn trong DB (missingAccount): ${JSON.stringify(report.missingAccount)}`,
    );
    if (report.deferred.length > 0) console.log('Các account hoãn: chờ khôi phục SPEC-063.');
    if (!report.complete) process.exitCode = 1;
  } finally {
    await client.end();
  }
}
try {
  await main();
} catch (error) {
  console.error(
    'Đối chiếu danh tính thất bại:',
    error instanceof Error ? error.message : 'Lỗi chưa xác định',
  );
  process.exitCode = 1;
}
