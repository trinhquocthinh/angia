import type pg from 'pg';
import { describe, expect, it, vi } from 'vitest';
import { enterFamilyDeletionRole } from './resolveFamilyDeletionRole.js';

function createFakeClient(rows: Array<{ rolname: string }>) {
  const query = vi.fn(async () => ({ rows }));
  const escapeIdentifier = vi.fn((value: string) => `"${value.replaceAll('"', '""')}"`);
  return {
    client: { query, escapeIdentifier } as unknown as pg.PoolClient,
    query,
    escapeIdentifier,
  };
}

describe('enterFamilyDeletionRole', () => {
  it('ném lỗi family_deletion_role_missing và không gọi SET LOCAL ROLE khi truy vấn trả 0 dòng', async () => {
    const { client, query, escapeIdentifier } = createFakeClient([]);

    await expect(enterFamilyDeletionRole(client)).rejects.toThrow('family_deletion_role_missing');
    expect(query).toHaveBeenCalledTimes(1);
    expect(escapeIdentifier).not.toHaveBeenCalled();
  });

  it('ném lỗi family_deletion_role_missing và không gọi SET LOCAL ROLE khi truy vấn trả 2 dòng', async () => {
    const { client, query, escapeIdentifier } = createFakeClient([
      { rolname: 'angia_a_family_deletion' },
      { rolname: 'angia_b_family_deletion' },
    ]);

    await expect(enterFamilyDeletionRole(client)).rejects.toThrow('family_deletion_role_missing');
    expect(query).toHaveBeenCalledTimes(1);
    expect(escapeIdentifier).not.toHaveBeenCalled();
  });

  it('gọi SET LOCAL ROLE với tên role đã qua escapeIdentifier khi truy vấn trả đúng 1 dòng', async () => {
    const { client, query, escapeIdentifier } = createFakeClient([{ rolname: 'angia_dev_family_deletion' }]);

    await enterFamilyDeletionRole(client);

    expect(escapeIdentifier).toHaveBeenCalledTimes(1);
    expect(escapeIdentifier).toHaveBeenCalledWith('angia_dev_family_deletion');
    expect(query).toHaveBeenCalledTimes(2);
    expect(query).toHaveBeenNthCalledWith(2, 'SET LOCAL ROLE "angia_dev_family_deletion"');
  });

  it('escape đúng tên role chứa ký tự đặc biệt như dấu ngoặc kép trước khi gọi SET LOCAL ROLE', async () => {
    const roleName = 'angia_"odd";DROP TABLE x;_family_deletion';
    const { client, query, escapeIdentifier } = createFakeClient([{ rolname: roleName }]);

    await enterFamilyDeletionRole(client);

    expect(escapeIdentifier).toHaveBeenCalledTimes(1);
    expect(escapeIdentifier).toHaveBeenCalledWith(roleName);
    expect(query).toHaveBeenCalledTimes(2);
    expect(query).toHaveBeenNthCalledWith(2, 'SET LOCAL ROLE "angia_""odd"";DROP TABLE x;_family_deletion"');
  });
});
