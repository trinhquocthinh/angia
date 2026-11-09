import createClient from 'openapi-fetch';
import { expect, it } from 'vitest';
import type { paths } from '@src/shared/api/schema.gen';
import { createPainJournalApi } from './painJournalApi';
import { issue } from '../test/painIssues.test-helper';

it('TC-684/687: vòng đời main/self đúng đường dẫn, body, CSRF, no-store và hủy request', async () => {
  const requests: Request[] = [];
  const api = createPainJournalApi(
    createClient<paths>({
      baseUrl: 'https://test.local',
      fetch: async (r) => {
        requests.push(r);
        if (r.method === 'DELETE') return new Response(null, { status: 204 });
        return Response.json(
          r.method === 'GET'
            ? { entryCount: 5, exerciseCount: 2 }
            : { ...issue, status: 'resolved', resolvedOn: '2026-11-07' },
        );
      },
    }),
  );
  const controller = new AbortController();
  for (const target of ['p', null]) {
    expect(
      await api.resolve(target, issue.id, { resolvedOn: '2026-11-07' }, 'csrf', controller.signal),
    ).toMatchObject({ status: 'resolved', resolvedOn: '2026-11-07' });
    expect(await api.deletionImpact(target, issue.id, controller.signal)).toEqual({
      entryCount: 5,
      exerciseCount: 2,
    });
    await api.deleteIssue(target, issue.id, 'csrf', controller.signal);
  }
  expect(requests.map((r) => [r.method, new URL(r.url).pathname])).toEqual(
    ['health-profiles/p', 'me/profile'].flatMap((p) => [
      ['POST', `/api/${p}/pain-issues/${issue.id}/resolve`],
      ['GET', `/api/${p}/pain-issues/${issue.id}/deletion-impact`],
      ['DELETE', `/api/${p}/pain-issues/${issue.id}`],
    ]),
  );
  for (const r of requests) {
    expect(r.cache).toBe('no-store');
    if (r.method !== 'GET') {
      expect(r.headers.get('X-CSRF-Token')).toBe('csrf');
      expect(await r.json()).toEqual(r.method === 'POST' ? { resolvedOn: '2026-11-07' } : { confirm: true });
    }
  }
  controller.abort();
  expect(requests.every((r) => r.signal.aborted)).toBe(true);
});
it('TC-687: từ chối tác động sai DTO, giữ lỗi API và không gửi ngày sai', async () => {
  let calls = 0;
  const api = createPainJournalApi(
    createClient<paths>({
      baseUrl: 'https://test.local',
      fetch: async () => {
        calls++;
        return calls === 1
          ? Response.json({ entryCount: -1, exerciseCount: 0 })
          : Response.json(
              {
                error: { code: 'ERR_CONSENT_REQUIRED', message: 'Cần đồng thuận' },
              },
              { status: 409 },
            );
      },
    }),
  );
  await expect(api.resolve('p', issue.id, { resolvedOn: 'sai' }, 'csrf')).rejects.toThrow();
  expect(calls).toBe(0);
  await expect(api.deletionImpact('p', issue.id)).rejects.toThrow();
  await expect(api.deleteIssue(null, issue.id, 'csrf')).rejects.toMatchObject({
    status: 409,
    code: 'ERR_CONSENT_REQUIRED',
  });
});
