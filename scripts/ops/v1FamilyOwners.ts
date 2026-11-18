import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import pg from 'pg';
import { parseV1FamilyMapping } from './parseV1FamilyMapping.js';
import { runV1FamilyOwners } from './runV1FamilyOwners.js';
import { V1FamilyOwnersError } from './V1FamilyOwnersError.js';

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      env: { type: 'string' },
      mapping: { type: 'string' },
      creators: { type: 'string' },
      'dry-run': { type: 'boolean', default: false },
    },
  });
  if (!values.mapping || !values.creators)
    throw new V1FamilyOwnersError('Cần --mapping <file> và --creators <file> do owner xác nhận.');
  if (values.env !== undefined && !['dev', 'sit', 'prod', 'test'].includes(values.env))
    throw new V1FamilyOwnersError('--env phải là dev, sit, prod hoặc test.');
  const mapping = parseV1FamilyMapping(
    JSON.parse(await readFile(values.mapping, 'utf8')),
    JSON.parse(await readFile(values.creators, 'utf8')),
  );
  const connectionString = process.env.DATABASE_OWNER_URL;
  if (!connectionString) throw new V1FamilyOwnersError('Thiếu DATABASE_OWNER_URL.');
  const client = new pg.Client({
    connectionString,
    connectionTimeoutMillis: 10_000,
    application_name: 'angia-v1-family-owners',
  });
  try {
    await client.connect();
    console.log(
      JSON.stringify(
        await runV1FamilyOwners(client, mapping, {
          dryRun: values['dry-run'],
          ...(values.env === undefined ? {} : { env: values.env }),
        }),
        null,
        2,
      ),
    );
  } finally {
    await client.end();
  }
}

try {
  await main();
} catch (error) {
  console.error(
    'Chuyển đổi Chủ hộ thất bại:',
    error instanceof V1FamilyOwnersError
      ? error.message
      : 'Kiểm tra tệp JSON, cấu hình kết nối, quyền owner, constraint hoặc ghi đồng thời; đã huỷ transaction nếu bắt đầu.',
  );
  process.exitCode = 1;
}
