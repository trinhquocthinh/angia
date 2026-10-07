import createClient from 'openapi-fetch';
import { describe, expect, it } from 'vitest';
import type { paths } from '@src/shared/api/schema.gen';
import { createAdminRepository } from './createAdminRepository';
import { executeAdminAction } from '../application/executeAdminAction';
import type { AdminCommand } from '../application/ports';

function harness(status = 200, body?: unknown) {
  const requests: Request[] = [];
  const client = createClient<paths>({
    baseUrl: 'http://localhost',
    credentials: 'same-origin',
    fetch: async (request) => {
      requests.push(request);
      const data = request.url.endsWith('/families')
        ? { id: '11111111-1111-4111-8111-111111111111', name: 'Nhà An', createdAt: '2026-10-05T00:00:00Z' }
        : {
            id: '22222222-2222-4222-8222-222222222222',
            displayName: 'An',
            isSystemAdmin: false,
            familyId: '11111111-1111-4111-8111-111111111111',
            role: 'main',
          };
      return Response.json(body ?? data, { status });
    },
  });
  return { repository: createAdminRepository(client), requests };
}
describe('Thao tác quản trị qua hợp đồng HTTP thật', () => {
  it.each([
    [{ type: 'create', name: '  Nhà An  ' }, 'POST', '/api/admin/families', { name: 'Nhà An' }],
    [
      { type: 'assign', accountId: 'a', familyId: 'f', role: 'main' },
      'POST',
      '/api/admin/accounts/a/membership',
      { familyId: 'f', role: 'main' },
    ],
    [
      { type: 'role', accountId: 'a', role: 'member' },
      'PATCH',
      '/api/admin/accounts/a/membership',
      { action: 'change_role', role: 'member' },
    ],
    [{ type: 'remove', accountId: 'a' }, 'PATCH', '/api/admin/accounts/a/membership', { action: 'remove' }],
  ] as const)('gửi đúng yêu cầu cho %j', async (command, method, path, body) => {
    const { repository, requests } = harness();
    await executeAdminAction(repository, 'csrf-session', command);
    const request = requests[0]!;
    expect(request.method).toBe(method);
    expect(new URL(request.url).pathname).toBe(path);
    expect(request.headers.get('X-CSRF-Token')).toBe('csrf-session');
    expect(request.credentials).toBe('same-origin');
    expect(await request.json()).toEqual(body);
  });
  it.each(['', '   ', 'a'.repeat(61)])('tên nhóm không hợp lệ không gửi HTTP', async (name) => {
    const { repository, requests } = harness();
    await expect(executeAdminAction(repository, 'csrf', { type: 'create', name })).rejects.toThrow();
    expect(requests).toHaveLength(0);
  });
  it('thiếu CSRF không gửi HTTP', async () => {
    const { repository, requests } = harness();
    await expect(executeAdminAction(repository, '', { type: 'remove', accountId: 'a' })).rejects.toThrow();
    expect(requests).toHaveLength(0);
  });
  it.each(['ERR_LAST_MAIN', 'ERR_FIRST_ACCOUNT_MUST_BE_MAIN', 'ERR_ACCOUNT_ALREADY_IN_FAMILY'])(
    'giữ nguyên lỗi nghiệp vụ %s',
    async (code) => {
      const { repository } = harness(409, { error: { code, message: 'Chi tiết nội bộ' } });
      const command: AdminCommand = { type: 'remove', accountId: 'a' };
      await expect(executeAdminAction(repository, 'csrf', command)).rejects.toMatchObject({
        code,
        status: 409,
      });
    },
  );
  it.each([401, 403, 500])('phản hồi %s không được coi là thành công', async (status) => {
    const { repository } = harness(status, { error: { code: 'ERR_INTERNAL', message: 'SQL secret' } });
    await expect(repository.listFamilies()).rejects.toMatchObject({ status });
    await expect(repository.listFamilies()).rejects.not.toThrow('SQL secret');
  });
  it('200 thiếu dữ liệu không được coi là thành công', async () => {
    const client = createClient<paths>({
      baseUrl: 'http://localhost',
      fetch: async () => new Response(null),
    });
    await expect(createAdminRepository(client).listFamilies()).rejects.toThrow();
  });
});
