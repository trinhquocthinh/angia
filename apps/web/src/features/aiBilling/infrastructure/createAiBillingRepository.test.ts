import createClient from 'openapi-fetch';
import { describe, expect, it } from 'vitest';
import type { paths } from '@src/shared/api/schema.gen';
import { createAiBillingRepository } from './createAiBillingRepository';

const empty = {
  month: '2026-10',
  unit: 'USD',
  status: 'unconfigured',
  confirmedSpendUsd: '0.000000000000',
  actualSpendUsd: null,
  lastSyncedAt: null,
  sources: [],
};
function harness(status = 200, body: unknown = empty) {
  const requests: Request[] = [];
  const client = createClient<paths>({
    baseUrl: 'http://localhost',
    credentials: 'same-origin',
    fetch: async (request) => {
      requests.push(request);
      return Response.json(body, { status });
    },
  });
  return { requests, repository: createAiBillingRepository(client) };
}
describe('HTTP số liệu phí provider', () => {
  it('TC-547: GET no-store và same-origin, signal hủy được truyền; không có lệnh sync/write từ web', async () => {
    const h = harness();
    const controller = new AbortController();
    expect(await h.repository.get(controller.signal)).toEqual(empty);
    const request = h.requests[0]!;
    expect(new URL(request.url).pathname).toBe('/api/admin/ai-billing');
    expect(request.method).toBe('GET');
    expect(request.cache).toBe('no-store');
    expect(request.credentials).toBe('same-origin');
    controller.abort();
    expect(request.signal.aborted).toBe(true);
  });
  it('TC-547: response sai schema không biến thành0USD ready', async () => {
    await expect(harness(200, { amount: 0 }).repository.get()).rejects.toMatchObject({
      code: 'ERR_INTERNAL',
    });
  });
  it.each([401, 403])('TC-547: lỗi quyền%s không hiển thị body server tùy ý', async (status) => {
    const h = harness(status, { error: { code: 'ERR_INTERNAL', message: 'SYNTHETIC_PRIVATE_DETAIL' } });
    await expect(h.repository.get()).rejects.toMatchObject({ status });
    await expect(h.repository.get()).rejects.not.toThrow('SYNTHETIC_PRIVATE_DETAIL');
  });
});
