import createClient from 'openapi-fetch';
import { describe, expect, it } from 'vitest';
import { DEFAULT_AI_ROUTING_SETTINGS } from '@angia/contracts';
import type { paths } from '@src/shared/api/schema.gen';
import { createAiRoutingRepository } from './createAiRoutingRepository';

const initial = { version: 0, settings: DEFAULT_AI_ROUTING_SETTINGS, updatedAt: null, updatedBy: null };
function harness(status = 200, body: unknown = initial) {
  const requests: Request[] = [];
  const client = createClient<paths>({
    baseUrl: 'http://localhost',
    credentials: 'same-origin',
    fetch: async (request) => {
      requests.push(request);
      return Response.json(body, { status });
    },
  });
  return { requests, repository: createAiRoutingRepository(client) };
}
describe('HTTP cấu hình OCR', () => {
  it('TC-509: GET no-store, same-origin và truyền signal hủy', async () => {
    const { requests, repository } = harness();
    const controller = new AbortController();
    expect(await repository.get(controller.signal)).toEqual(initial);
    const request = requests[0]!;
    expect(new URL(request.url).pathname).toBe('/api/admin/ai-routing');
    expect(request.method).toBe('GET');
    expect(request.cache).toBe('no-store');
    expect(request.credentials).toBe('same-origin');
    controller.abort();
    expect(request.signal.aborted).toBe(true);
  });
  it('TC-509: PUT gửi đúng version, cấu hình và CSRF, không tự gán actor', async () => {
    const { requests, repository } = harness();
    const input = {
      expectedVersion: 0,
      settings: { ...DEFAULT_AI_ROUTING_SETTINGS, selectedProvider: 'openrouter' as const },
    };
    await repository.save(input, 'synthetic-csrf');
    expect(requests[0]?.method).toBe('PUT');
    expect(requests[0]?.headers.get('x-csrf-token')).toBe('synthetic-csrf');
    expect(await requests[0]?.json()).toEqual(input);
  });
  it.each([401, 403])('TC-510: lỗi quyền %s được chuẩn hóa, không trả body lỗi tùy ý', async (status) => {
    const { repository } = harness(status, {
      error: { code: 'ERR_INTERNAL', message: 'SYNTHETIC_PRIVATE_DETAIL' },
    });
    await expect(repository.get()).rejects.toMatchObject({ status });
    await expect(repository.get()).rejects.not.toThrow('SYNTHETIC_PRIVATE_DETAIL');
  });
  it('TC-511: giữ mã xung đột 409 để form yêu cầu tải lại', async () => {
    const { repository } = harness(409, { error: { code: 'ERR_AI_ROUTING_CONFLICT', message: 'server' } });
    await expect(
      repository.save(
        { expectedVersion: 0, settings: { ...DEFAULT_AI_ROUTING_SETTINGS, selectedProvider: 'openrouter' } },
        'csrf',
      ),
    ).rejects.toMatchObject({ code: 'ERR_AI_ROUTING_CONFLICT', status: 409 });
  });
  it('TC-509: HTTP 200 sai hợp đồng không biến thành cấu hình mặc định', async () => {
    await expect(harness(200, { version: 0 }).repository.get()).rejects.toMatchObject({
      code: 'ERR_INTERNAL',
    });
  });
});
