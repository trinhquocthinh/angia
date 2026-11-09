import createClient from 'openapi-fetch';
import { expect, it } from 'vitest';
import type { paths } from '@src/shared/api/schema.gen';
import { issue } from '../test/painIssues.test-helper';
import { createPainContextApi } from './painContextApi';
const range = { from: '2026-11-01', to: '2026-11-07' };
const context = { ...range, asNeededDoses: [], courses: [] };
const make = (fetch: (request: Request) => Promise<Response>) =>
  createPainContextApi(createClient<paths>({ baseUrl: 'https://test.local', fetch }));
it('đọc bối cảnh main/self đúng khoảng, no-store và hủy bằng signal', async () => {
  const requests: Request[] = [];
  const api = make(async (request) => {
    requests.push(request);
    return Response.json(context);
  });
  const controller = new AbortController();
  expect(await api.context('p', issue.id, range, controller.signal)).toEqual(context);
  await api.context(null, issue.id, range);
  expect(requests.map((request) => request.url)).toEqual([
    `https://test.local/api/health-profiles/p/pain-issues/${issue.id}/context?from=2026-11-01&to=2026-11-07`,
    `https://test.local/api/me/profile/pain-issues/${issue.id}/context?from=2026-11-01&to=2026-11-07`,
  ]);
  expect(requests.every((request) => request.cache === 'no-store')).toBe(true);
  controller.abort();
  expect(requests[0]!.signal.aborted).toBe(true);
});
it('từ chối phản hồi sai hợp đồng, giữ mã lỗi quyền và che lỗi máy chủ', async () => {
  await expect(make(async () => Response.json({})).context(null, issue.id, range)).rejects.toThrow();
  for (const status of [403, 404, 409, 500]) {
    const api = make(async () =>
      Response.json({ error: { code: 'ERR_CONSENT_REQUIRED', message: 'Chi tiết riêng' } }, { status }),
    );
    await expect(api.context(null, issue.id, range)).rejects.toMatchObject({ status });
    if (status === 500)
      await expect(api.context(null, issue.id, range)).rejects.toThrow('Không thể tải bối cảnh thuốc.');
  }
});
