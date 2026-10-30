import createClient from 'openapi-fetch';
import { describe, expect, it } from 'vitest';
import type { paths } from '@src/shared/api/schema.gen';
import { createRevisitRepository } from './createRevisitRepository';
const id = '00000000-0000-4000-8000-000000000001';
describe('TC-473/474 — adapter lịch tái khám', () => {
  it('GET mặc định hôm nay, PUT ngày/null với CSRF', async () => {
    const calls: { url: string; method: string; csrf: string | null; body: string }[] = [];
    const client = createClient<paths>({
      baseUrl: 'https://test.local',
      fetch: async (request) => {
        const body = await request.text();
        calls.push({
          url: request.url,
          method: request.method,
          csrf: request.headers.get('x-csrf-token'),
          body,
        });
        return Response.json(
          request.method === 'GET'
            ? [
                {
                  revisitDate: '2026-11-20',
                  prescriptions: [{ id, issuedDate: '2026-10-01', facility: null }],
                },
              ]
            : JSON.parse(body),
        );
      },
    });
    const repo = createRevisitRepository(client);
    expect((await repo.list(id))[0]?.prescriptions).toHaveLength(1);
    for (const date of ['2026-11-22', null])
      expect(await repo.setDate(id, id, date, 'csrf')).toEqual({ revisitDate: date });
    expect(calls[0]?.url).toBe(`https://test.local/api/health-profiles/${id}/revisits`);
    expect(calls.slice(1)).toEqual(
      ['2026-11-22', null].map((revisitDate) => ({
        url: `https://test.local/api/health-profiles/${id}/prescriptions/${id}/revisit-date`,
        method: 'PUT',
        csrf: 'csrf',
        body: JSON.stringify({ revisitDate }),
      })),
    );
  });
  it('giữ mã lỗi 4xx, che lỗi 500 và từ chối response sai schema', async () => {
    for (const status of [404, 500]) {
      const repo = createRevisitRepository(
        createClient<paths>({
          baseUrl: 'https://test.local',
          fetch: async () =>
            Response.json({ error: { code: 'ERR_NOT_FOUND', message: 'Chi tiết' } }, { status }),
        }),
      );
      await expect(repo.list(id)).rejects.toMatchObject({
        status,
        message: status === 404 ? 'Chi tiết' : 'Không thể tải lịch tái khám. Vui lòng thử lại.',
      });
    }
    const repo = createRevisitRepository(
      createClient<paths>({
        baseUrl: 'https://test.local',
        fetch: async () => Response.json([{ revisitDate: 'sai' }]),
      }),
    );
    await expect(repo.list(id)).rejects.toThrow();
  });
});
