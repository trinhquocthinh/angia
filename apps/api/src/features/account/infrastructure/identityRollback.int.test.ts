import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest';
import pg from 'pg';
import { startTestDatabase } from '@src/shared/test/startTestDatabase.js';
import { runMigrations } from '@src/shared/db/runMigrations.js';
import { seedIdentityMigrationFixtures } from './identityMigrationFixtures.js';

// Import URL để không đưa scripts ngoài rootDir vào build API.
const base = '../../../../../../scripts/ops/';
const { readIdentityInventory } = await import(
  new URL(`${base}readIdentityInventory.ts`, import.meta.url).href
);
const { applyIdentityMapping } = await import(
  new URL(`${base}applyIdentityMapping.ts`, import.meta.url).href
);
const { runIdentityRollback } = await import(new URL(`${base}runIdentityRollback.ts`, import.meta.url).href);
let database: Awaited<ReturnType<typeof startTestDatabase>>;
let owner: pg.Client;
let databaseName: string;
let fixture: Awaited<ReturnType<typeof seedIdentityMigrationFixtures>>;
const fakeHash = '$argon2id$v=19$m=65536,t=3,p=1$c2FsdHRodQ$aGFzaHRodQ';

beforeAll(async () => {
  database = await startTestDatabase();
  await runMigrations(database.ownerUrl);
  owner = new pg.Client({ connectionString: database.ownerUrl });
  await owner.connect();
  databaseName = (await owner.query<{ database: string }>('SELECT current_database() AS database')).rows[0]!
    .database;
});
beforeEach(async () => {
  await owner.query('TRUNCATE accounts, families CASCADE');
  fixture = await seedIdentityMigrationFixtures(owner);
});
afterAll(async () => {
  await owner?.end();
  await database?.container.stop();
});

async function migratedMapping() {
  const mapping = await readIdentityInventory(owner);
  for (const row of mapping.accounts) row.username = `nguoi-thu-${fixture.ids.indexOf(row.accountId)}`;
  await applyIdentityMapping(owner, mapping, { apply: true, database: databaseName });
  return mapping;
}

async function snapshot() {
  return {
    accounts: (await owner.query('SELECT * FROM accounts ORDER BY id')).rows,
    credentials: (await owner.query('SELECT * FROM account_credentials ORDER BY account_id')).rows,
  };
}

it('TC-908: dry-run báo đủ số dòng nhưng giữ nguyên username và không tạo credential', async () => {
  const mapping = await migratedMapping();
  const before = await snapshot();
  expect(before.credentials).toEqual([]);
  expect(await runIdentityRollback(owner, mapping, { apply: false })).toEqual({
    mode: 'dry-run',
    updated: 4,
  });
  expect(await snapshot()).toEqual(before);
});

it('TC-908: apply trả username về NULL, lần hai cập nhật 0 và không tạo credential', async () => {
  const mapping = await migratedMapping();
  expect(await runIdentityRollback(owner, mapping, { apply: true })).toEqual({ mode: 'apply', updated: 4 });
  const after = await snapshot();
  expect(after.accounts).toHaveLength(5);
  expect(after.accounts.every((row) => row.username_normalized === null)).toBe(true);
  expect(after.credentials).toEqual([]);
  expect(await runIdentityRollback(owner, mapping, { apply: true })).toEqual({ mode: 'apply', updated: 0 });
  expect(await snapshot()).toEqual(after);
});

it('TC-908: apply giữ account có credential và username khác mapping, không đổi credential', async () => {
  const mapping = await migratedMapping();
  await owner.query('INSERT INTO account_credentials (account_id, password_hash) VALUES ($1,$2)', [
    fixture.ids[0],
    fakeHash,
  ]);
  await owner.query('UPDATE accounts SET username_normalized=$1 WHERE id=$2', ['ten-khac', fixture.ids[1]]);
  const before = await snapshot();
  expect(await runIdentityRollback(owner, mapping, { apply: true })).toEqual({ mode: 'apply', updated: 2 });
  expect(await snapshot()).toEqual({
    ...before,
    accounts: before.accounts.map((row) => ({
      ...row,
      username_normalized: fixture.ids.slice(0, 2).includes(row.id) ? row.username_normalized : null,
    })),
  });
});

it('TC-900: apply từ chối DB đích sai và không ghi username', async () => {
  const mapping = await readIdentityInventory(owner);
  for (const row of mapping.accounts) row.username = `nguoi-thu-${fixture.ids.indexOf(row.accountId)}`;
  const before = await snapshot();
  await expect(applyIdentityMapping(owner, mapping, { apply: true, database: 'sai_ten' })).rejects.toThrow(
    /DB/,
  );
  expect(await snapshot()).toEqual(before);
});
