import type pg from 'pg';
import { expect, it, vi } from 'vitest';
import { readRlsInventory } from './readRlsInventory.js';
import { RLS_INVENTORY_QUERIES } from './rlsInventoryQueries.js';

it('kiểm kê trong transaction chỉ đọc và giữ đủ các phần báo cáo', async () => {
  const query = vi.fn().mockResolvedValue({ rows: [] });
  const report = await readRlsInventory({ query } as unknown as pg.ClientBase);

  expect(query).toHaveBeenNthCalledWith(1, 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  expect(query).toHaveBeenNthCalledWith(2, "SET LOCAL statement_timeout = '10s'");
  expect(query).toHaveBeenLastCalledWith('COMMIT');
  expect(report.format).toBe('angia-rls-inventory/1');
  for (const [name, statement] of Object.entries(RLS_INVENTORY_QUERIES)) {
    expect(query).toHaveBeenCalledWith(statement);
    expect(report).toHaveProperty(name, []);
  }
});

it('giữ nguyên metadata do PostgreSQL trả về trong báo cáo', async () => {
  const roles = [{ name: 'angia_test_app', bypass_rls: false }];
  const query = vi.fn(async (statement: string) => ({
    rows: statement === RLS_INVENTORY_QUERIES.roles ? roles : [],
  }));

  const report = await readRlsInventory({ query } as unknown as pg.ClientBase);
  expect(report).toHaveProperty('roles', roles);
});

it('rollback và báo lỗi nếu không đọc được một phần kiểm kê', async () => {
  const failure = new Error('Không đọc được catalog');
  const query = vi
    .fn()
    .mockResolvedValue({ rows: [] })
    .mockResolvedValueOnce({ rows: [] })
    .mockResolvedValueOnce({ rows: [] })
    .mockRejectedValueOnce(failure);

  await expect(readRlsInventory({ query } as unknown as pg.ClientBase)).rejects.toBe(failure);
  expect(query).toHaveBeenLastCalledWith('ROLLBACK');
  expect(query).not.toHaveBeenCalledWith('COMMIT');
});
