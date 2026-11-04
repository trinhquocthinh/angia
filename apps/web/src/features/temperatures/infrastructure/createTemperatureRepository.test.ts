import createClient from 'openapi-fetch';
import { describe, expect, it } from 'vitest';
import type { paths } from '@src/shared/api/schema.gen';
import { createTemperatureRepository } from './createTemperatureRepository';

const id = '00000000-0000-4000-8000-000000000001';
const reading = {
  id,
  celsius: 38.5,
  measuredAt: '2026-11-04T06:50:00Z',
  recordedBy: null,
  recordedAt: '2026-11-04T07:00:00Z',
};
const filter = { from: '2026-11-01', to: '2026-11-04' };
const make = (fetch: (request: Request) => Promise<Response>) =>
  createTemperatureRepository(createClient<paths>({ baseUrl: 'https://test.local', fetch }));
describe('Adapter nhiệt độ', () => {
  it('TC-502: main và self đọc đúng route, ngày và no-store', async () => {
    const requests: Request[] = [];
    const repo = make(async (request) => {
      requests.push(request);
      return Response.json({ readings: [reading] });
    });
    expect(await repo.list(id, filter, new AbortController().signal)).toEqual({ readings: [reading] });
    await repo.list(null, filter);
    expect(requests.map((r) => r.url)).toEqual([
      `https://test.local/api/health-profiles/${id}/temperatures?from=2026-11-01&to=2026-11-04`,
      'https://test.local/api/me/profile/temperatures?from=2026-11-01&to=2026-11-04',
    ]);
    expect(requests.every((r) => r.cache === 'no-store')).toBe(true);
  });
  it('TC-500/501: ghi/xóa truyền CSRF, giữ xác nhận chủ đích và nhận 204', async () => {
    const requests: Request[] = [];
    const repo = make(async (request) => {
      requests.push(request);
      return request.method === 'DELETE'
        ? new Response(null, { status: 204 })
        : Response.json(reading, { status: 201 });
    });
    const body = { celsius: 48, measuredAt: reading.measuredAt, confirmOutOfRange: true };
    await repo.record(id, body, 'csrf');
    await repo.remove(id, id, 'csrf');
    expect(await requests[0]!.json()).toEqual(body);
    expect(requests.map((r) => [r.method, r.headers.get('X-CSRF-Token')])).toEqual([
      ['POST', 'csrf'],
      ['DELETE', 'csrf'],
    ]);
    expect(requests[1]!.url).toBe(`https://test.local/api/health-profiles/${id}/temperatures/${id}`);
  });
  it('TC-501: giữ mã lỗi xác nhận; che lỗi server và chặn phản hồi sai hợp đồng', async () => {
    await expect(
      make(async () =>
        Response.json(
          { error: { code: 'ERR_OUT_OF_RANGE_UNCONFIRMED', message: 'Cần xác nhận' } },
          { status: 422 },
        ),
      ).record(id, { celsius: 48, measuredAt: reading.measuredAt, confirmOutOfRange: false }, 'csrf'),
    ).rejects.toMatchObject({ status: 422, code: 'ERR_OUT_OF_RANGE_UNCONFIRMED' });
    await expect(make(async () => new Response('secret', { status: 500 })).list(id, filter)).rejects.toThrow(
      'Không thể tải nhiệt độ. Vui lòng thử lại.',
    );
    await expect(make(async () => Response.json({ readings: [{}] })).list(id, filter)).rejects.toThrow();
  });
});
