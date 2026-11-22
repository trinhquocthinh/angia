import { OpenAPIHono } from '@hono/zod-openapi';
import { describe, expect, it, vi } from 'vitest';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorResponse } from '@src/shared/http/errorResponse.js';
import { PasswordHashBusyError } from '@src/shared/identity/application/PasswordHashBusyError.js';
import { passwordResetFixture } from '@src/shared/test/passwordResetTestFixture.js';
import type { EmailPasswordResetDeps } from '../application/passwordResetPorts.js';
import { registerPasswordResetRoutes } from './registerPasswordResetRoutes.js';

function fixture(background = true) {
  const t = passwordResetFixture();
  const logger = { warn: vi.fn() };
  const app = new OpenAPIHono<AppEnv>({
    defaultHook: (result, c) => (result.success ? undefined : errorResponse(c, 'ERR_VALIDATION')),
  });
  const deps: EmailPasswordResetDeps = { ...t.deps };
  delete deps.runInBackground;
  registerPasswordResetRoutes(app, {
    ...deps,
    ...(background ? { runInBackground: t.deps.runInBackground } : {}),
    appBaseUrl: 'https://angia.example',
    clientIp: (c) => c.req.header('x-test-ip') ?? 'ip',
    logger,
  });
  const request = (
    path: string,
    body: object,
    origin = 'https://angia.example',
    mediaType = 'application/json',
  ) =>
    app.request(`/api/auth/${path}`, {
      method: 'POST',
      headers: { origin, 'content-type': mediaType },
      body: JSON.stringify(body),
    });
  return { ...t, logger, request };
}

describe('SPEC-063: hợp đồng HTTP đặt lại mật khẩu', () => {
  it('TC-762: phản hồi 202 no-store không cần phiên, không chờ công việc nền', async () => {
    const t = fixture();
    const response = await t.request('password-reset-requests', { email: 'a@example.com' });
    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ received: true });
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(t.resets.request).not.toHaveBeenCalled();
    await t.tasks[0]!();
    expect(t.resets.request).toHaveBeenCalledWith('a@example.com', new Date(0));
  });
  it('TC-764: hash busy được ánh xạ 503 và không tiêu token', async () => {
    const t = fixture();
    t.deps.hasher.hash = async () => {
      throw new PasswordHashBusyError();
    };
    const response = await t.request('password-resets', { token: 'valid', newPassword: 'Strong123' });
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_AUTH_UNAVAILABLE' } });
    expect(t.resets.consume).not.toHaveBeenCalled();
  });
  it('TC-765: token sai trả thông điệp nguyên văn và 400', async () => {
    const t = fixture();
    t.resets.findValid.mockResolvedValueOnce(null);
    const response = await t.request('password-resets', { token: 'bad', newPassword: 'Strong123' });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: {
        code: 'ERR_RESET_TOKEN_INVALID',
        message: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
      },
    });
  });
  it('TC-766: lượt thứ tư trả 429 với Retry-After và no-store', async () => {
    const t = fixture();
    for (let i = 0; i < 3; i++) await t.request('password-reset-requests', { email: `a${i}@example.com` });
    const response = await t.request('password-reset-requests', { email: 'unknown@example.com' });
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('3600');
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
  it.each(['password-reset-requests', 'password-resets'])(
    'TC-763: %s bắt buộc Origin và JSON tin cậy',
    async (path) => {
      const t = fixture();
      for (const [origin, type] of [
        ['https://evil.example', 'application/json'],
        ['https://angia.example', 'text/plain'],
      ]) {
        const response = await t.request(path, {}, origin, type);
        expect(response.status).toBe(403);
        expect(response.headers.get('cache-control')).toBe('no-store');
      }
    },
  );
  it.each([{}, { email: 1 }, { email: '' }, { email: 'a'.repeat(255) }])(
    'TC-762: body sai hình dạng %j trả 422',
    async (body) => {
      expect((await fixture().request('password-reset-requests', body)).status).toBe(422);
    },
  );
  it('TC-763: lỗi nền chỉ ghi tên lỗi, không email hoặc token', async () => {
    const t = fixture(false);
    t.resets.request.mockRejectedValueOnce(new Error('secret-token secret@example.com'));
    expect((await t.request('password-reset-requests', { email: 'secret@example.com' })).status).toBe(202);
    await vi.waitFor(() =>
      expect(t.logger.warn).toHaveBeenCalledExactlyOnceWith(
        { err: 'Error' },
        'Yêu cầu đặt lại mật khẩu nền thất bại',
      ),
    );
  });
});
