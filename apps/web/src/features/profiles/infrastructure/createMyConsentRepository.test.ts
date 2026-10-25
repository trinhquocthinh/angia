import createClient from 'openapi-fetch';
import { describe, expect, it } from 'vitest';
import type { paths } from '@src/shared/api/schema.gen';
import { createMyConsentRepository } from './createMyConsentRepository';
function harness(status: number, body: unknown) {
  const requests: Request[] = [];
  const client = createClient<paths>({
    baseUrl: 'http://localhost',
    credentials: 'same-origin',
    fetch: async (request) => {
      requests.push(request);
      return Response.json(body, { status });
    },
  });
  return { repository: createMyConsentRepository(client), requests };
}
describe('TC-384 — repository đồng thuận của tôi', () => {
  it('GET đọc đồng thuận qua /api/me/consent', async () => {
    const { repository, requests } = harness(200, { profile: null });
    expect(await repository.get()).toEqual({ profile: null });
    expect(requests[0]?.method).toBe('GET');
    expect(new URL(requests[0]!.url).pathname).toBe('/api/me/consent');
  });
  it('POST rút đồng thuận gửi header X-CSRF-Token và body rỗng', async () => {
    const { repository, requests } = harness(200, {
      consentStatus: 'withdrawn',
      withdrawnAt: '2026-10-24T03:00:00Z',
    });
    await repository.withdraw('csrf');
    expect(requests[0]?.method).toBe('POST');
    expect(new URL(requests[0]!.url).pathname).toBe('/api/me/consent/withdraw');
    expect(requests[0]?.headers.get('X-CSRF-Token')).toBe('csrf');
    expect(await requests[0]!.json()).toEqual({});
  });
  it('409 trả ProfileRequestError mang mã lỗi', async () => {
    const { repository } = harness(409, { error: { code: 'ERR_CONSENT_NOT_CONFIRMED', message: 'Chưa' } });
    await expect(repository.withdraw('csrf')).rejects.toMatchObject({
      status: 409,
      code: 'ERR_CONSENT_NOT_CONFIRMED',
    });
  });
});
