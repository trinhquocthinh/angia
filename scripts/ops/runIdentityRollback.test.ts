import type pg from 'pg';
import { expect, it, vi } from 'vitest';
import type { IdentityMapping } from './parseIdentityMapping.js';
import { runIdentityRollback } from './runIdentityRollback.js';

const mapping: IdentityMapping = {
  format: 'angia-identity-mapping/1',
  generatedAt: '2026-11-15T00:00:00.000Z',
  accounts: [],
  skipped: [],
};

it.each([
  { apply: false, mode: 'dry-run', end: 'ROLLBACK' },
  { apply: true, mode: 'apply', end: 'COMMIT' },
])('TC-908: $mode chạy UPDATE trong transaction rồi $end', async ({ apply, mode, end }) => {
  const query = vi.fn().mockResolvedValue({ rows: [], rowCount: 3 });
  const result = await runIdentityRollback({ query } as unknown as pg.ClientBase, mapping, { apply });

  expect(result).toEqual({ mode, updated: 3 });
  expect(query.mock.calls.map(([sql]) => sql)).toEqual([
    'BEGIN',
    expect.stringMatching(/^UPDATE accounts/),
    end,
  ]);
  expect(query.mock.calls[1]?.[1]).toEqual([[], []]);
});

it('TC-908: không có dòng khớp trả updated bằng 0', async () => {
  const query = vi.fn().mockResolvedValue({ rows: [], rowCount: 0 });
  expect(await runIdentityRollback({ query } as unknown as pg.ClientBase, mapping, { apply: true })).toEqual({
    mode: 'apply',
    updated: 0,
  });
});

it.each(['UPDATE', 'COMMIT'])('TC-908: lỗi %s thì ROLLBACK và ném lại lỗi gốc', async (statement) => {
  const failure = new Error('Lỗi cơ sở dữ liệu thử nghiệm');
  const query = vi.fn(async (sql: string) => {
    if (sql.startsWith(statement)) throw failure;
    return { rows: [], rowCount: 1 };
  });

  await expect(
    runIdentityRollback({ query } as unknown as pg.ClientBase, mapping, { apply: true }),
  ).rejects.toBe(failure);
  expect(query.mock.calls.map(([sql]) => sql)).toEqual([
    'BEGIN',
    expect.stringMatching(/^UPDATE accounts/),
    ...(statement === 'COMMIT' ? ['COMMIT'] : []),
    'ROLLBACK',
  ]);
});
