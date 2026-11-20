import createClient from 'openapi-fetch';
import { expect, it } from 'vitest';
import type { paths } from '@src/shared/api/schema.gen';
import { createProfileGuardiansRepository } from './createProfileGuardiansRepository';

function harness(status = 204, body: unknown = null) {
  const requests: Request[] = [];
  const client = createClient<paths>({
    baseUrl: 'http://localhost',
    credentials: 'same-origin',
    fetch: async (request) => {
      requests.push(request);
      return status === 204 ? new Response(null, { status }) : Response.json(body, { status });
    },
  });
  return { repository: createProfileGuardiansRepository(client), requests };
}

it('thêm và tự gỡ gửi đúng đường dẫn, body, cookie và CSRF', async () => {
  const { repository, requests } = harness();
  expect(await repository.add('child', 'main', 'csrf')).toEqual({ ok: true, value: undefined });
  expect(await repository.removeSelf('child', 'csrf')).toEqual({ ok: true, value: undefined });
  expect(
    requests.map((r) => [r.method, new URL(r.url).pathname, r.headers.get('X-CSRF-Token'), r.credentials]),
  ).toEqual([
    ['POST', '/api/health-profiles/child/guardians', 'csrf', 'same-origin'],
    ['DELETE', '/api/health-profiles/child/guardians/me', 'csrf', 'same-origin'],
  ]);
  expect(await requests[0]!.json()).toEqual({ guardianAccountId: 'main' });
});

it('không gửi request ghi thiếu CSRF', async () => {
  const { repository, requests } = harness();
  expect(await repository.add('child', 'main', '')).toEqual({ ok: false, code: 'ERR_CSRF' });
  expect(await repository.removeSelf('child', '')).toEqual({ ok: false, code: 'ERR_CSRF' });
  expect(requests).toHaveLength(0);
});

it('giữ mã ERR_LAST_GUARDIAN từ HTTP 409', async () => {
  const { repository } = harness(409, { error: { code: 'ERR_LAST_GUARDIAN' } });
  expect(await repository.removeSelf('child', 'csrf')).toEqual({ ok: false, code: 'ERR_LAST_GUARDIAN' });
});

it('GET giám hộ theo hồ sơ, ứng viên lấy từ thành viên cùng nhà', async () => {
  const { repository, requests } = harness(200, { guardians: [], members: [] });
  await repository.list('child');
  await repository.listCandidates();
  expect(requests.map((r) => new URL(r.url).pathname)).toEqual([
    '/api/health-profiles/child/guardians',
    '/api/family/members',
  ]);
});
