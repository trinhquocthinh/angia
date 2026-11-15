import type pg from 'pg';
import { expect, it, vi } from 'vitest';
import { applyIdentityMapping } from './applyIdentityMapping.js';
import type { IdentityMapping } from './parseIdentityMapping.js';
import { reconcileIdentityMapping } from './reconcileIdentityMapping.js';
import { rollbackIdentityUsernames } from './rollbackIdentityUsernames.js';

const id = '00000000-0000-4000-8000-000000000001';
const outsideId = '00000000-0000-4000-8000-000000000002';
const mapping: IdentityMapping = {
  format: 'angia-identity-mapping/1',
  generatedAt: '2026-11-15T00:00:00.000Z',
  skipped: [],
  accounts: [
    {
      accountId: id,
      oidcSubject: 'oidc-thu',
      familyId: null,
      familyRole: null,
      isSystemAdmin: true,
      displayName: 'Người Thử',
      currentUsername: null,
      hasCredential: false,
      username: 'nguoi-thu',
      status: 'migrate',
    },
  ],
};
const snapshot = {
  accounts: 1,
  credentials: 1,
  accountsWithUsername: 1,
  checksum: 'account-checksum',
  credentialsChecksum: 'credential-checksum',
};

it('TC-908: account OIDC ngoài mapping làm đối chiếu chưa hoàn tất', async () => {
  const query = vi
    .fn()
    .mockResolvedValue({ rows: [] })
    .mockResolvedValueOnce({ rows: [] })
    .mockResolvedValueOnce({
      rows: [
        { id, username: 'nguoi-thu', hasCredential: true },
        { id: outsideId, username: null, hasCredential: false },
      ],
    });
  expect(await reconcileIdentityMapping({ query } as unknown as pg.ClientBase, mapping)).toEqual({
    migrated: 1,
    missingUsername: [],
    usernameMismatch: [],
    missingCredential: [],
    unmapped: [outsideId],
    missingAccount: [],
    deferred: [],
    complete: false,
  });
});
it('TC-908: account bị xóa chỉ nằm trong missingAccount', async () => {
  const query = vi.fn().mockResolvedValue({ rows: [] });
  expect(await reconcileIdentityMapping({ query } as unknown as pg.ClientBase, mapping)).toEqual({
    migrated: 0,
    missingUsername: [],
    usernameMismatch: [],
    missingCredential: [],
    unmapped: [],
    missingAccount: [id],
    deferred: [],
    complete: false,
  });
});
it('TC-908: rollback chỉ gửi cặp ID và username của dòng migrate vốn NULL tới DB', async () => {
  // DB kiểm username hiện tại và credential bằng UPDATE có điều kiện; integration kiểm dữ liệu thật.
  const query = vi.fn().mockResolvedValue({ rowCount: 1 });
  const accounts: IdentityMapping['accounts'] = [
    mapping.accounts[0]!,
    { ...mapping.accounts[0]!, accountId: outsideId, currentUsername: 'ten-cu', username: 'ten-cu' },
    { ...mapping.accounts[0]!, accountId: '00000000-0000-4000-8000-000000000003', status: 'defer' },
  ];
  expect(
    await rollbackIdentityUsernames({ query } as unknown as pg.ClientBase, { ...mapping, accounts }),
  ).toEqual({ updated: 1 });
  expect(query).toHaveBeenCalledExactlyOnceWith(expect.any(String), [[id], ['nguoi-thu']]);
});
it('TC-900: thay đổi checksum credential làm apply hủy transaction dù số đếm giữ nguyên', async () => {
  const query = vi.fn(async (sql: string) => {
    if (sql.startsWith('SELECT\n')) {
      const changed = query.mock.calls.filter(([statement]) => statement.startsWith('SELECT\n')).length > 1;
      return {
        rows: [{ ...snapshot, credentialsChecksum: changed ? 'changed' : snapshot.credentialsChecksum }],
      };
    }
    if (sql.includes('SELECT username_normalized')) return { rows: [{ username: 'nguoi-thu' }] };
    return { rows: [], rowCount: 0 };
  });
  await expect(
    applyIdentityMapping({ query } as unknown as pg.ClientBase, mapping, { apply: true }),
  ).rejects.toThrow(/Đối chiếu trước\/sau/);
  expect(query).toHaveBeenLastCalledWith('ROLLBACK');
});
