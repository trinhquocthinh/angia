import createClient from 'openapi-fetch';
import { describe, expect, it } from 'vitest';
import type { paths } from '@src/shared/api/schema.gen';
import { AdherenceRequestError } from '../application/AdherenceRequestError';
import { createAdherenceRepository } from './createAdherenceRepository';

const id = '00000000-0000-4000-8000-000000000001';
const period = {
  id,
  healthProfileId: id,
  medicationName: 'Amlodipin',
  status: 'stopped',
  fromDate: '2026-10-10',
  toDate: null,
};
const clientReturning = (response: Response, sent: Request[] = []) =>
  createClient<paths>({
    baseUrl: 'https://test.local',
    fetch: async (request) => {
      sent.push(request);
      return response;
    },
  });

describe('TC-266 adapter API giai đoạn dùng thuốc', () => {
  it('liệt kê: đúng route, kiểm hợp đồng response', async () => {
    const sent: Request[] = [];
    const repository = createAdherenceRepository(
      clientReturning(Response.json({ today: '2026-10-13', periods: [period] }), sent),
    );
    expect(await repository.list(id)).toEqual({ today: '2026-10-13', periods: [period] });
    expect(sent[0]!.url).toBe(`https://test.local/api/health-profiles/${id}/adherence-periods`);
  });

  it('ghi nhận: POST kèm CSRF và body; lỗi 422 mang thông điệp API', async () => {
    const sent: Request[] = [];
    const body = { medicationName: 'Amlodipin', status: 'stopped', fromDate: '2026-10-10' } as const;
    const ok = createAdherenceRepository(clientReturning(Response.json(period, { status: 201 }), sent));
    expect(await ok.record(id, body, 'csrf')).toEqual(period);
    expect(sent[0]!.method).toBe('POST');
    expect(sent[0]!.headers.get('x-csrf-token')).toBe('csrf');
    expect(await sent[0]!.json()).toEqual(body);
    const failing = createAdherenceRepository(
      clientReturning(
        Response.json(
          { error: { code: 'ERR_VALIDATION', message: 'Mốc phải sau giai đoạn trước.' } },
          { status: 422 },
        ),
      ),
    );
    const error = await failing.record(id, body, 'csrf').catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(AdherenceRequestError);
    expect(error).toMatchObject({
      message: 'Mốc phải sau giai đoạn trước.',
      status: 422,
      code: 'ERR_VALIDATION',
    });
  });

  it('lỗi 5xx → thông điệp chung', async () => {
    const failing = createAdherenceRepository(clientReturning(new Response('boom', { status: 500 })));
    await expect(failing.list(id)).rejects.toMatchObject({
      message: 'Không tải được giai đoạn dùng thuốc. Vui lòng thử lại.',
      status: 500,
    });
  });
});
