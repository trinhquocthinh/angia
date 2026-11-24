import type pg from 'pg';
import { expect, it, vi } from 'vitest';
import { enterDataExportRole, leaveDataExportRole } from './enterDataExportRole.js';

function fixture(rows: Array<{ rolname: string }>) {
  const query = vi.fn(async (_sql: string, _values?: unknown[]) => ({ rows }));
  const escapeIdentifier = vi.fn((name: string) => `"${name.replaceAll('"', '""')}"`);
  return { client: { query, escapeIdentifier } as unknown as pg.PoolClient, query, escapeIdentifier };
}
it.each([{ rows: [] }, { rows: [{ rolname: 'a_data_export' }, { rolname: 'b_data_export' }] }])(
  'TC-823: thiếu role duy nhất thì không đặt tài khoản hoặc đổi role (%j)',
  async ({ rows }) => {
    const { client, query, escapeIdentifier } = fixture(rows);
    await expect(enterDataExportRole(client, 'account')).rejects.toThrow('data_export_role_missing');
    expect(query).toHaveBeenCalledOnce();
    expect(escapeIdentifier).not.toHaveBeenCalled();
  },
);
it('TC-823: chỉ nhận role có quyền SET và đặt tài khoản trước khi đổi role đã escape', async () => {
  const { client, query } = fixture([{ rolname: 'angia_"odd"_data_export' }]);
  await enterDataExportRole(client, 'account');
  expect(query.mock.calls[0]![0]).toContain('m.set_option');
  expect(query.mock.calls[0]![0]).toContain("LIKE '%\\_data\\_export'");
  expect(query).toHaveBeenNthCalledWith(2, "SELECT set_config('app.export_account_id', $1, true)", [
    'account',
  ]);
  expect(query).toHaveBeenNthCalledWith(3, 'SET LOCAL ROLE "angia_""odd""_data_export"');
});
it('TC-823: rời role trước khi xoá phạm vi tài khoản', async () => {
  const { client, query } = fixture([]);
  await leaveDataExportRole(client);
  expect(query).toHaveBeenNthCalledWith(1, 'RESET ROLE');
  expect(query).toHaveBeenNthCalledWith(2, "SELECT set_config('app.export_account_id', '', true)");
});
