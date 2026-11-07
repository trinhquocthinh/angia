import createClient from 'openapi-fetch';
import { expect, it } from 'vitest';
import type { paths } from '@src/shared/api/schema.gen';
import { issue } from '../test/painIssues.test-helper';
import { createPainJournalApi } from './painJournalApi';

const entry = {
  id: issue.id,
  level: 4,
  recordedAt: issue.updatedAt,
  note: null,
  createdBy: null,
  updatedBy: null,
  updatedAt: issue.updatedAt,
};
it('sửa/xóa main và self đúng endpoint, CSRF, no-store, hủy và xóa trắng ghi chú', async () => {
  const requests: Request[] = [];
  const api = createPainJournalApi(
    createClient<paths>({
      baseUrl: 'https://test.local',
      fetch: async (request) => {
        requests.push(request);
        return request.method === 'DELETE' ? new Response(null, { status: 204 }) : Response.json(entry);
      },
    }),
  );
  const controller = new AbortController();
  for (const target of ['p', null]) {
    expect(
      await api.updateEntry(target, issue.id, entry.id, { level: 4, note: null }, 'csrf', controller.signal),
    ).toEqual(entry);
    await api.deleteEntry(target, issue.id, entry.id, 'csrf', controller.signal);
  }
  expect(requests.map((r) => [r.method, new URL(r.url).pathname])).toEqual(
    ['health-profiles/p', 'me/profile'].flatMap((prefix) =>
      ['PATCH', 'DELETE'].map((method) => [
        method,
        `/api/${prefix}/pain-issues/${issue.id}/entries/${entry.id}`,
      ]),
    ),
  );
  for (const request of requests) {
    expect(request.headers.get('X-CSRF-Token')).toBe('csrf');
    expect(request.cache).toBe('no-store');
    if (request.method === 'PATCH') expect(await request.json()).toEqual({ level: 4, note: '' });
  }
  controller.abort();
  expect(requests.every((r) => r.signal.aborted)).toBe(true);
});
it('giữ reason last_entry và từ chối DTO phản hồi sai', async () => {
  let invalid = false;
  const api = createPainJournalApi(
    createClient<paths>({
      baseUrl: 'https://test.local',
      fetch: async () =>
        invalid
          ? Response.json({})
          : Response.json(
              {
                error: {
                  code: 'ERR_VALIDATION',
                  message: 'Lần ghi cuối',
                  details: { reason: 'last_entry' },
                },
              },
              { status: 422 },
            ),
    }),
  );
  await expect(api.deleteEntry(null, issue.id, entry.id, 'csrf')).rejects.toMatchObject({
    status: 422,
    reason: 'last_entry',
  });
  invalid = true;
  await expect(api.updateEntry(null, issue.id, entry.id, { level: 4 }, 'csrf')).rejects.toThrow();
});
