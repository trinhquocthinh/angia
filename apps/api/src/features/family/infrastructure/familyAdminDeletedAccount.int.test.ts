import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDatabase } from '@src/shared/db/createDatabase.js';
import { startRegistrationTestApp } from '@src/shared/test/startRegistrationTestApp.js';
import { createFamilyAdminRepository } from './createFamilyAdminRepository.js';

describe('Quản trị bỏ qua tài khoản đã xoá (SPEC-073)', () => {
  let fixture: Awaited<ReturnType<typeof startRegistrationTestApp>>;
  beforeAll(async () => {
    fixture = await startRegistrationTestApp();
  });
  afterAll(async () => {
    await fixture?.close();
  });

  it('TC-827: bia mộ không được liệt kê hoặc khoá để gán vào nhà', async () => {
    const deletedId = randomUUID();
    const activeId = randomUUID();
    await fixture.owner.query(
      "INSERT INTO accounts (id, display_name, deleted_at) VALUES ($1, '', now()), ($2, 'Thành viên', NULL)",
      [deletedId, activeId],
    );
    const repository = createFamilyAdminRepository(createDatabase(fixture.pool));
    const rows = await repository.listAccounts();
    expect(rows.map((row) => row.id)).toContain(activeId);
    expect(rows.map((row) => row.id)).not.toContain(deletedId);
    expect(await repository.inTransaction((store) => store.lockAccount(deletedId))).toBeNull();
    expect(await repository.inTransaction((store) => store.lockAccount(activeId))).toMatchObject({
      id: activeId,
    });
  });
});
