import createClient from 'openapi-fetch';
import { describe, expect, it } from 'vitest';
import type { paths } from '@src/shared/api/schema.gen';
import { chain, detail, profileId, secondId } from '../test/fixtures.test-helper';
import { createPrescriptionRepository } from './createPrescriptionRepository';

describe('TC-481/484 — adapter chuỗi đơn', () => {
  it('đọc đúng hai route, giữ thứ tự API, không cache và truyền signal', async () => {
    const calls: Request[] = [];
    const repository = createPrescriptionRepository(
      createClient<paths>({
        baseUrl: 'https://test.local',
        fetch: async (request) => {
          calls.push(request);
          return Response.json(request.url.endsWith(secondId) ? detail : chain);
        },
      }),
    );
    const controller = new AbortController();
    expect(await repository.list(profileId, controller.signal)).toEqual(chain);
    expect(await repository.detail(profileId, secondId, controller.signal)).toEqual(detail);
    expect(calls.map((call) => [call.url, call.method, call.cache])).toEqual([
      [`https://test.local/api/health-profiles/${profileId}/prescriptions`, 'GET', 'no-store'],
      [`https://test.local/api/health-profiles/${profileId}/prescriptions/${secondId}`, 'GET', 'no-store'],
    ]);
    controller.abort();
    expect(calls.every((call) => call.signal.aborted)).toBe(true);
  });
  it.each([401, 403, 404, 409, 500])('giữ status %s và che lỗi máy chủ', async (status) => {
    const repository = createPrescriptionRepository(
      createClient<paths>({
        baseUrl: 'https://test.local',
        fetch: async () =>
          Response.json({ error: { code: 'ERR_NOT_FOUND', message: 'Không tìm thấy đơn' } }, { status }),
      }),
    );
    for (const request of [repository.list(profileId), repository.detail(profileId, secondId)]) {
      await expect(request).rejects.toMatchObject({
        status,
        message: status === 500 ? 'Không thể tải đơn thuốc. Vui lòng thử lại.' : 'Không tìm thấy đơn',
      });
    }
  });
  it('từ chối response sai hợp đồng ở cả danh sách và chi tiết', async () => {
    const repository = createPrescriptionRepository(
      createClient<paths>({
        baseUrl: 'https://test.local',
        fetch: async () => Response.json({ id: 'sai' }),
      }),
    );
    await expect(repository.list(profileId)).rejects.toThrow();
    await expect(repository.detail(profileId, secondId)).rejects.toThrow();
  });
});
