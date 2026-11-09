import createClient from 'openapi-fetch';
import { expect, it } from 'vitest';
import type { paths } from '@src/shared/api/schema.gen';
import { createPainJournalApi } from './painJournalApi';
import { issue } from '../test/painIssues.test-helper';
const exercise = {
  id: issue.id,
  name: 'Duỗi gối',
  source: 'self',
  prescriber: null,
  startDate: '2026-11-05',
  endDate: null,
  note: null,
  createdBy: null,
  updatedBy: null,
  updatedAt: issue.updatedAt,
};
it('TC-692/694: thêm/sửa main và self đúng đường dẫn, CSRF, no-store, AbortSignal và PATCH null', async () => {
  const requests: Request[] = [];
  const api = createPainJournalApi(
    createClient<paths>({
      baseUrl: 'https://test.local',
      fetch: async (r) => {
        requests.push(r);
        return Response.json(exercise);
      },
    }),
  );
  const controller = new AbortController();
  for (const target of ['p', null]) {
    expect(
      await api.createExercise(
        target,
        issue.id,
        { name: 'Duỗi gối', source: 'self', startDate: '2026-11-05' },
        'csrf',
        controller.signal,
      ),
    ).toEqual(exercise);
    expect(
      await api.updateExercise(target, issue.id, exercise.id, { endDate: null }, 'csrf', controller.signal),
    ).toEqual(exercise);
  }
  expect(requests.map((r) => [r.method, new URL(r.url).pathname])).toEqual(
    ['health-profiles/p', 'me/profile'].flatMap((prefix) => [
      ['POST', `/api/${prefix}/pain-issues/${issue.id}/exercises`],
      ['PATCH', `/api/${prefix}/pain-issues/${issue.id}/exercises/${exercise.id}`],
    ]),
  );
  for (const r of requests) {
    expect(r.headers.get('X-CSRF-Token')).toBe('csrf');
    expect(r.cache).toBe('no-store');
    if (r.method === 'PATCH') expect(await r.json()).toEqual({ endDate: null });
  }
  controller.abort();
  expect(requests.every((r) => r.signal.aborted)).toBe(true);
});
it('TC-692: từ chối DTO sai và giữ lỗi đồng thuận', async () => {
  let denied = false;
  const api = createPainJournalApi(
    createClient<paths>({
      baseUrl: 'https://test.local',
      fetch: async () =>
        denied
          ? Response.json(
              { error: { code: 'ERR_CONSENT_REQUIRED', message: 'Cần đồng thuận' } },
              { status: 409 },
            )
          : Response.json({}),
    }),
  );
  await expect(api.updateExercise(null, issue.id, issue.id, { endDate: null }, 'csrf')).rejects.toThrow();
  denied = true;
  await expect(api.updateExercise(null, issue.id, issue.id, { endDate: null }, 'csrf')).rejects.toMatchObject(
    { status: 409 },
  );
});
