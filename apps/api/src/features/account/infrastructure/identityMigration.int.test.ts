import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest';
import pg from 'pg';
import { startTestDatabase } from '@src/shared/test/startTestDatabase.js';
import { runMigrations } from '@src/shared/db/runMigrations.js';
import { seedIdentityMigrationFixtures } from './identityMigrationFixtures.js';

// Import URL giống legal seed để không đưa scripts ngoài rootDir vào build API.
const base = '../../../../../../scripts/ops/';
const { readIdentityInventory } = await import(
  new URL(`${base}readIdentityInventory.ts`, import.meta.url).href
);
const { applyIdentityMapping } = await import(
  new URL(`${base}applyIdentityMapping.ts`, import.meta.url).href
);
const { reconcileIdentityMapping } = await import(
  new URL(`${base}reconcileIdentityMapping.ts`, import.meta.url).href
);
const { rollbackIdentityUsernames } = await import(
  new URL(`${base}rollbackIdentityUsernames.ts`, import.meta.url).href
);
let database: Awaited<ReturnType<typeof startTestDatabase>>;
let owner: pg.Client;
let fixture: Awaited<ReturnType<typeof seedIdentityMigrationFixtures>>;
const fakeHash = '$argon2id$v=19$m=65536,t=3,p=1$c2FsdHRodQ$aGFzaHRodQ';

beforeAll(async () => {
  database = await startTestDatabase();
  await runMigrations(database.ownerUrl);
  owner = new pg.Client({ connectionString: database.ownerUrl });
  await owner.connect();
});
beforeEach(async () => {
  await owner.query('TRUNCATE accounts, families CASCADE');
  fixture = await seedIdentityMigrationFixtures(owner);
});
afterAll(async () => {
  await owner?.end();
  await database?.container.stop();
});
async function approvedMapping() {
  const mapping = await readIdentityInventory(owner);
  for (const row of mapping.accounts) row.username = `nguoi-thu-${fixture.ids.indexOf(row.accountId)}`;
  return mapping;
}
async function snapshot() {
  return {
    accounts: (await owner.query('SELECT * FROM accounts ORDER BY id')).rows,
    credentials: (await owner.query('SELECT * FROM account_credentials ORDER BY account_id')).rows,
    profiles: (await owner.query('SELECT * FROM health_profiles ORDER BY id')).rows,
  };
}
it('TC-900: kiểm kê chỉ đọc liệt kê đủ account OIDC kể cả admin, bỏ qua account không subject', async () => {
  const before = await snapshot();
  const mapping = await readIdentityInventory(owner);
  expect(mapping.accounts).toHaveLength(4);
  expect(mapping.accounts).toContainEqual(
    expect.objectContaining({
      accountId: fixture.ids[3],
      isSystemAdmin: true,
      familyId: null,
      familyRole: null,
      username: '',
      currentUsername: null,
      hasCredential: false,
      status: 'migrate',
    }),
  );
  expect(mapping.skipped).toEqual([{ accountId: fixture.ids[4], reason: 'no_oidc_subject' }]);
  const expectedOrder = await owner.query(`SELECT id FROM accounts WHERE oidc_subject IS NOT NULL
    ORDER BY family_id, family_role, id`);
  expect(mapping.accounts.map((row: { accountId: string }) => row.accountId)).toEqual(
    expectedOrder.rows.map((row) => row.id),
  );
  expect(await snapshot()).toEqual(before);
  await owner.query('UPDATE accounts SET username_normalized=$1 WHERE id=$2', ['ten-cu', fixture.ids[0]]);
  await owner.query('INSERT INTO account_credentials (account_id, password_hash) VALUES ($1,$2)', [
    fixture.ids[0],
    fakeHash,
  ]);
  expect((await readIdentityInventory(owner)).accounts).toContainEqual(
    expect.objectContaining({
      accountId: fixture.ids[0],
      username: 'ten-cu',
      currentUsername: 'ten-cu',
      hasCredential: true,
    }),
  );
});
it('TC-900: dry-run mặc định không ghi gì; apply ghi username, giữ ID/gia đình/vai trò/liên kết hồ sơ và credential', async () => {
  const mapping = await approvedMapping();
  await owner.query('INSERT INTO account_credentials (account_id, password_hash) VALUES ($1,$2)', [
    fixture.ids[0],
    fakeHash,
  ]);
  const before = await snapshot();
  const dry = await applyIdentityMapping(owner, mapping);
  expect(dry).toMatchObject({ mode: 'dry-run', updated: 4, unchanged: 0, deferred: 0 });
  expect(dry.after).toEqual({ ...dry.before, accountsWithUsername: dry.before.accountsWithUsername + 4 });
  expect(await snapshot()).toEqual(before);
  const result = await applyIdentityMapping(owner, mapping, { apply: true });
  expect(result).toMatchObject({ mode: 'apply', updated: 4 });
  expect(await snapshot()).toEqual({
    ...before,
    accounts: before.accounts.map((row) => ({
      ...row,
      username_normalized: row.oidc_subject === null ? null : `nguoi-thu-${fixture.ids.indexOf(row.id)}`,
    })),
  });
});
it('TC-900: apply lần hai idempotent (updated 0)', async () => {
  const mapping = await approvedMapping();
  await applyIdentityMapping(owner, mapping, { apply: true });
  const before = await snapshot();
  expect(await applyIdentityMapping(owner, mapping, { apply: true })).toMatchObject({
    updated: 0,
    unchanged: 4,
  });
  expect(await snapshot()).toEqual(before);
});
it.each(['subject', 'family', 'role', 'occupied', 'conflict', 'missing'])(
  'TC-900: lệch subject/gia đình/vai trò hoặc username đã thuộc account khác thì rollback toàn bộ (%s)',
  async (kind) => {
    const mapping = await approvedMapping();
    const row = mapping.accounts[3];
    if (kind === 'subject') row.oidcSubject = 'subject-khac';
    if (kind === 'family') row.familyId = fixture.families[1];
    if (kind === 'role') row.familyRole = 'main';
    if (kind === 'missing') row.accountId = '00000000-0000-4000-8000-000000000099';
    if (kind === 'occupied')
      await owner.query('UPDATE accounts SET username_normalized=$1 WHERE id=$2', [
        row.username,
        fixture.ids[4],
      ]);
    if (kind === 'conflict')
      await owner.query('UPDATE accounts SET username_normalized=$1 WHERE id=$2', [
        'ten-khac',
        row.accountId,
      ]);
    const before = await snapshot();
    await expect(applyIdentityMapping(owner, mapping, { apply: true })).rejects.toThrow();
    expect(await snapshot()).toEqual(before);
  },
);
it('TC-908: đối chiếu báo thiếu credential và defer; complete sau khi đủ credential', async () => {
  const mapping = await approvedMapping();
  const deferredId = mapping.accounts[3].accountId;
  mapping.accounts[3].status = 'defer';
  mapping.accounts[3].username = '';
  const initial = await reconcileIdentityMapping(owner, mapping);
  expect(initial.missingUsername).toHaveLength(3);
  expect(initial.missingCredential).toHaveLength(3);
  expect(initial.complete).toBe(false);
  expect(await applyIdentityMapping(owner, mapping, { apply: true })).toMatchObject({
    updated: 3,
    deferred: 1,
  });
  expect(await reconcileIdentityMapping(owner, mapping)).toMatchObject({
    migrated: 0,
    missingUsername: [],
    usernameMismatch: [],
    deferred: [deferredId],
    complete: false,
  });
  for (const row of mapping.accounts) {
    if (row.status === 'migrate')
      await owner.query('INSERT INTO account_credentials (account_id, password_hash) VALUES ($1,$2)', [
        row.accountId,
        fakeHash,
      ]);
  }
  expect(await reconcileIdentityMapping(owner, mapping)).toEqual({
    migrated: 3,
    missingUsername: [],
    usernameMismatch: [],
    missingCredential: [],
    unmapped: [],
    missingAccount: [],
    deferred: [deferredId],
    complete: true,
  });
  const row = mapping.accounts[0];
  await owner.query('UPDATE accounts SET username_normalized=$1 WHERE id=$2', ['ten-khac', row.accountId]);
  expect(await reconcileIdentityMapping(owner, mapping)).toMatchObject({
    usernameMismatch: [row.accountId],
    complete: false,
  });
  await owner.query('DELETE FROM accounts WHERE id=$1', [row.accountId]);
  expect(await reconcileIdentityMapping(owner, mapping)).toEqual({
    migrated: 2,
    missingUsername: [],
    usernameMismatch: [],
    missingCredential: [],
    unmapped: [],
    missingAccount: [row.accountId],
    deferred: [deferredId],
    complete: false,
  });
});
it('TC-908: rollback username bằng SQL trong runbook khôi phục đúng trạng thái trước apply, không tạo credential', async () => {
  const mapping = await approvedMapping();
  const before = await snapshot();
  await applyIdentityMapping(owner, mapping, { apply: true });
  await rollbackIdentityUsernames(owner, mapping);
  expect(await snapshot()).toEqual(before);
  await applyIdentityMapping(owner, mapping, { apply: true });
  await owner.query('INSERT INTO account_credentials (account_id, password_hash) VALUES ($1,$2)', [
    fixture.ids[0],
    fakeHash,
  ]);
  await rollbackIdentityUsernames(owner, mapping);
  expect((await owner.query('SELECT id FROM accounts WHERE username_normalized IS NOT NULL')).rows).toEqual([
    { id: fixture.ids[0] },
  ]);
  expect((await owner.query('SELECT password_hash FROM account_credentials')).rows).toEqual([
    { password_hash: fakeHash },
  ]);
});

it('TC-908: đối chiếu phát hiện account OIDC tạo sau kiểm kê ngoài mapping', async () => {
  const mapping = await approvedMapping();
  for (const row of mapping.accounts) row.status = 'defer';
  const newId = '00000000-0000-4000-8000-000000000099';
  await owner.query(
    `INSERT INTO accounts (id, oidc_subject, display_name, is_system_admin)
    VALUES ($1, 'oidc-thu-moi', 'Người Thử Mới', true)`,
    [newId],
  );
  expect(await reconcileIdentityMapping(owner, mapping)).toEqual({
    migrated: 0,
    missingUsername: [],
    usernameMismatch: [],
    missingCredential: [],
    unmapped: [newId],
    missingAccount: [],
    deferred: mapping.accounts.map((row: { accountId: string }) => row.accountId),
    complete: false,
  });
});
it('TC-908: rollback giữ username có trước apply dù chưa có credential', async () => {
  await owner.query("UPDATE accounts SET username_normalized='ten-cu' WHERE id=$1", [fixture.ids[0]]);
  const mapping = await approvedMapping();
  const existing = mapping.accounts.find((row: { accountId: string }) => row.accountId === fixture.ids[0]);
  existing.username = 'ten-cu';
  const before = await snapshot();
  await applyIdentityMapping(owner, mapping, { apply: true });
  await rollbackIdentityUsernames(owner, mapping);
  expect(await snapshot()).toEqual(before);
});
