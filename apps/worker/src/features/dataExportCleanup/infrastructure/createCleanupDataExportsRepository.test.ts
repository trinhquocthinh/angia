import type pg from 'pg';
import { expect, it, vi } from 'vitest';
import { createCleanupDataExportsRepository } from './createCleanupDataExportsRepository.js';

it('TC-825: phân trang dòng ready hết hạn, xoá có điều kiện và giữ export còn hiệu lực', async () => {
  const query = vi
    .fn()
    .mockResolvedValueOnce({ rows: [{ id: 'id', object_key: 'exports/id.zip' }] })
    .mockResolvedValueOnce({ rows: [] })
    .mockResolvedValueOnce({ rowCount: 1 })
    .mockResolvedValueOnce({ rows: [{ active: true }] });
  const repo = createCleanupDataExportsRepository({ query } as unknown as pg.Pool);
  const rows = [];
  for await (const row of repo.expired()) rows.push(row);
  expect(rows).toEqual([{ id: 'id', objectKey: 'exports/id.zip' }]);
  expect(query.mock.calls[0]?.[0]).toContain("status='ready' AND expires_at <= now()");
  expect(query.mock.calls[1]?.[1]).toEqual(['id']);
  expect(await repo.removeExpired('id')).toBe(true);
  expect(query.mock.calls[2]?.[0]).toContain("status='ready' AND expires_at <= now()");
  expect(await repo.isActive('id')).toBe(true);
  expect(query.mock.calls[3]?.[0]).toContain('expires_at > now()');
  expect(query.mock.calls[3]?.[0]).toContain("created_at > now()-interval '24 hours'");
});
it('TC-825: xoá failed cũ rồi đánh dấu pending quá 24 giờ để giữ trạng thái failed', async () => {
  const query = vi.fn().mockResolvedValueOnce({ rowCount: 2 }).mockResolvedValueOnce({ rowCount: 3 });
  const repo = createCleanupDataExportsRepository({ query } as unknown as pg.Pool);
  expect(await repo.expireStale()).toEqual({ pendingFailed: 3, failedRemoved: 2 });
  expect(query.mock.calls[1]?.[0]).toContain("UPDATE data_exports SET status='failed'");
  expect(query.mock.calls[0]?.[0]).toContain("created_at <= now()-interval '24 hours'");
  expect(query.mock.calls[0]?.[0]).toContain("DELETE FROM data_exports WHERE status='failed'");
});
