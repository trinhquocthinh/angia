import createClient from 'openapi-fetch';
import { expect, it } from 'vitest';
import type { paths } from '@src/shared/api/schema.gen';
import { createAdminAuditRepository } from './createAdminAuditRepository';
import { createAdminStatsRepository } from './createAdminStatsRepository';
function harness(status: number, body: unknown) {
  const requests: Request[] = [];
  const client = createClient<paths>({
    baseUrl: 'https://sit.local',
    fetch: async (request) => {
      requests.push(request);
      return Response.json(body, { status });
    },
  });
  return { client, requests };
}
it('TC-844: thống kê yêu cầu 12 tuần và truyền signal', async () => {
  const h = harness(200, { weeks: [] });
  const controller = new AbortController();
  expect(await createAdminStatsRepository(h.client).get(controller.signal)).toEqual({ weeks: [] });
  expect(new URL(h.requests[0]!.url).searchParams.get('weeks')).toBe('12');
  expect(new URL(h.requests[0]!.url).pathname).toBe('/api/admin/stats');
  controller.abort();
  expect(h.requests[0]!.signal.aborted).toBe(true);
});
it('TC-841: nhật ký giữ bộ lọc và cursor nguyên vẹn', async () => {
  const h = harness(200, { items: [], nextCursor: 'next' });
  const controller = new AbortController();
  const query = {
    from: '2026-11-26T17:00:00.000Z',
    to: '2026-11-27T17:00:00.000Z',
    action: 'email_changed' as const,
    familyId: 'family',
    accountId: 'account',
    cursor: 'micro+cursor/==',
    limit: 50,
  };
  expect(await createAdminAuditRepository(h.client).list(query, controller.signal)).toEqual({
    items: [],
    nextCursor: 'next',
  });
  const url = new URL(h.requests[0]!.url);
  expect(url.pathname).toBe('/api/admin/audit-events');
  expect(Object.fromEntries(url.searchParams)).toEqual({ ...query, limit: '50' });
  controller.abort();
  expect(h.requests[0]!.signal.aborted).toBe(true);
});
it.each([401, 403, 422, 500])('TC-841/844: giữ trạng thái lỗi %s', async (status) => {
  const h = harness(status, { error: { code: 'ERR_VALIDATION' } });
  for (const request of [
    createAdminStatsRepository(h.client).get(),
    createAdminAuditRepository(h.client).list({}),
  ])
    await expect(request).rejects.toMatchObject({ status });
});
