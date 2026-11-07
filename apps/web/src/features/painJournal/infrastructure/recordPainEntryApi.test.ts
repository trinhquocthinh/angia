import createClient from 'openapi-fetch';
import { expect, it } from 'vitest';
import type { paths } from '@src/shared/api/schema.gen';
import { issue } from '../test/painIssues.test-helper';
import { createPainJournalApi } from './painJournalApi';

const entry = {
  id: issue.id,
  level: 6,
  recordedAt: issue.updatedAt,
  note: null,
  createdBy: null,
  updatedBy: null,
  updatedAt: issue.updatedAt,
};
it('TC-723 — ghi main/self đúng endpoint, CSRF, body, no-store và hủy request', async () => {
  const requests: Request[] = [];
  const api = createPainJournalApi(
    createClient<paths>({
      baseUrl: 'https://test.local',
      fetch: async (request) => {
        requests.push(request);
        return Response.json(entry, { status: 201 });
      },
    }),
  );
  const controller = new AbortController();
  expect(await api.record('p', issue.id, { level: 6 }, 'csrf', controller.signal)).toEqual(entry);
  await api.record(null, issue.id, { level: 6 }, 'csrf');
  expect(requests.map((r) => new URL(r.url).pathname)).toEqual([
    `/api/health-profiles/p/pain-issues/${issue.id}/entries`,
    `/api/me/profile/pain-issues/${issue.id}/entries`,
  ]);
  for (const request of requests) {
    expect(request.headers.get('X-CSRF-Token')).toBe('csrf');
    expect(request.cache).toBe('no-store');
    expect(await request.json()).toEqual({ level: 6 });
  }
  controller.abort();
  expect(requests[0]!.signal.aborted).toBe(true);
});
it('TC-723 — lỗi trạng thái giữ đúng mã để sheet cho phép mở lại', async () => {
  const api = createPainJournalApi(
    createClient<paths>({
      baseUrl: 'https://test.local',
      fetch: async () =>
        Response.json(
          { error: { code: 'ERR_INVALID_STATE_TRANSITION', message: 'Đã khỏi' } },
          { status: 409 },
        ),
    }),
  );
  await expect(api.record(null, issue.id, { level: 6 }, 'csrf')).rejects.toMatchObject({
    status: 409,
    code: 'ERR_INVALID_STATE_TRANSITION',
  });
});

it('TC-723 — đọc chi tiết và mở lại qua main/self, kiểm chứng phản hồi', async () => {
  const requests: Request[] = [];
  const detail = { ...issue, entries: [entry], exercises: [], statusEvents: [] };
  const api = createPainJournalApi(
    createClient<paths>({
      baseUrl: 'https://test.local',
      fetch: async (request) => {
        requests.push(request);
        return Response.json(request.method === 'GET' ? detail : issue);
      },
    }),
  );
  for (const target of ['p', null]) {
    expect(await api.detail(target, issue.id)).toEqual(detail);
    expect(await api.reopen(target, issue.id, 'csrf')).toEqual(issue);
  }
  expect(requests.map((r) => new URL(r.url).pathname)).toEqual([
    `/api/health-profiles/p/pain-issues/${issue.id}`,
    `/api/health-profiles/p/pain-issues/${issue.id}/reopen`,
    `/api/me/profile/pain-issues/${issue.id}`,
    `/api/me/profile/pain-issues/${issue.id}/reopen`,
  ]);
  for (const request of requests) {
    expect(request.cache).toBe('no-store');
    if (request.method === 'POST') {
      expect(request.headers.get('X-CSRF-Token')).toBe('csrf');
      expect(await request.json()).toEqual({});
    }
  }
  const invalid = createPainJournalApi(
    createClient<paths>({ baseUrl: 'https://test.local', fetch: async () => Response.json({}) }),
  );
  await expect(invalid.detail(null, issue.id)).rejects.toThrow();
  await expect(invalid.reopen(null, issue.id, 'csrf')).rejects.toThrow();
  await expect(invalid.record(null, issue.id, { level: 6 }, 'csrf')).rejects.toThrow();
});
