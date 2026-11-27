import createClient from 'openapi-fetch';
import { expect, it } from 'vitest';
import type { paths } from '@src/shared/api/schema.gen';
import { createRegistrationSwitchRepository } from './createRegistrationSwitchRepository';
import { createFoundingInvitationRepository } from './createFoundingInvitationRepository';

function harness(status: number, body?: unknown) {
  const requests: Request[] = [];
  const client = createClient<paths>({
    baseUrl: 'https://sit.local',
    fetch: async (request) => {
      requests.push(request);
      return status === 204 ? new Response(null, { status }) : Response.json(body, { status });
    },
  });
  return { client, requests };
}
it('TC-832: đọc công khai giá trị mặc định bật từ API', async () => {
  const { client, requests } = harness(200, { registrationOpen: true });
  expect(await createRegistrationSwitchRepository(client).get()).toEqual({ registrationOpen: true });
  expect(requests[0]!.method).toBe('GET');
  expect(new URL(requests[0]!.url).pathname).toBe('/api/registration-switch');
});
it('TC-833: gửi đúng PUT, CSRF và giá trị mở đăng ký', async () => {
  const { client, requests } = harness(200, { registrationOpen: false });
  expect(await createRegistrationSwitchRepository(client).set(false, 'csrf')).toEqual({
    registrationOpen: false,
  });
  expect(requests[0]!.method).toBe('PUT');
  expect(new URL(requests[0]!.url).pathname).toBe('/api/admin/registration-switch');
  expect(requests[0]!.headers.get('X-CSRF-Token')).toBe('csrf');
  expect(await requests[0]!.json()).toEqual({ open: false });
});
it.each([401, 403, 500])('TC-834: giữ mã trạng thái lỗi %s', async (status) => {
  const { client } = harness(status, { error: { code: 'ERR_INTERNAL' } });
  await expect(createRegistrationSwitchRepository(client).set(false, 'csrf')).rejects.toMatchObject({
    status,
    code: status === 401 ? 'ERR_UNAUTHENTICATED' : status === 403 ? 'ERR_FORBIDDEN' : 'ERR_INTERNAL',
  });
});
it('SPEC-065: tạo lời mời đúng kind, CSRF, đường dẫn và giữ nguyên bí mật', async () => {
  const issued = {
    invitationId: 'id',
    code: 'AN-REAL',
    link: 'https://angia.test/invite#secret',
    expiresAt: '2026-12-01T18:00:00Z',
  };
  const { client, requests } = harness(201, issued);
  expect(await createFoundingInvitationRepository(client).create('csrf')).toEqual(issued);
  expect(requests[0]!.method).toBe('POST');
  expect(new URL(requests[0]!.url).pathname).toBe('/api/admin/founding-invitations');
  expect(await requests[0]!.json()).toEqual({ kind: 'found_family' });
  expect(requests[0]!.headers.get('X-CSRF-Token')).toBe('csrf');
});
it('SPEC-065: thu hồi chấp nhận 204 không có JSON', async () => {
  const { client, requests } = harness(204);
  await expect(createFoundingInvitationRepository(client).revoke('id', 'csrf')).resolves.toBeUndefined();
  expect(requests[0]!.method).toBe('DELETE');
  expect(new URL(requests[0]!.url).pathname).toBe('/api/admin/founding-invitations/id');
  expect(requests[0]!.headers.get('X-CSRF-Token')).toBe('csrf');
});
it.each([401, 403, 404, 500])('SPEC-065: thu hồi giữ lỗi %s', async (status) => {
  const { client } = harness(status, { error: { code: 'ERR_NOT_FOUND' } });
  await expect(createFoundingInvitationRepository(client).revoke('id', 'csrf')).rejects.toMatchObject({
    status,
  });
});
