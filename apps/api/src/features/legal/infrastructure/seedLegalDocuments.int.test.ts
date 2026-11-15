import { afterAll, beforeAll, expect, it } from 'vitest';
import pg from 'pg';
import { startTestDatabase } from '@src/shared/test/startTestDatabase.js';
import { runMigrations } from '@src/shared/db/runMigrations.js';
// Tác vụ ở gốc repo; nạp qua URL để không kéo source ngoài rootDir vào bản build API.
const seedModule = new URL('../../../../../../scripts/ops/insertLegalDocuments.ts', import.meta.url).href;
const { insertLegalDocuments } = await import(seedModule);

let database: Awaited<ReturnType<typeof startTestDatabase>>;
let owner: pg.Client;
beforeAll(async () => {
  database = await startTestDatabase();
  await runMigrations(database.ownerUrl);
  owner = new pg.Client({ connectionString: database.ownerUrl });
  await owner.connect();
});
afterAll(async () => {
  await owner?.end();
  await database?.container.stop();
});
it('TC-752: seed hai lần không thêm, hash khác lỗi và không sửa bản cũ', async () => {
  const doc = {
    kind: 'terms' as const,
    version: 'seed-test',
    publishedAt: new Date('2026-01-01'),
    material: true,
    contentPath: 'legal/terms.md',
    sha256: 'a'.repeat(64),
  };
  expect(await insertLegalDocuments(owner, [doc])).toEqual({ inserted: 1, existing: 0 });
  expect(await insertLegalDocuments(owner, [doc])).toEqual({ inserted: 0, existing: 1 });
  await expect(insertLegalDocuments(owner, [{ ...doc, sha256: 'b'.repeat(64) }])).rejects.toThrow();
  expect(
    (await owner.query('SELECT sha256 FROM legal_document_versions WHERE version=$1', [doc.version])).rows,
  ).toEqual([{ sha256: doc.sha256 }]);
});
