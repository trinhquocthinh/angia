import createClient from 'openapi-fetch';
import { describe, expect, it } from 'vitest';
import type { paths } from '@src/shared/api/schema.gen';
import { page, profileId } from '../test/fixtures.test-helper';
import { createTimelineRepository } from './createTimelineRepository';

describe('TC-503/504 — adapter dòng thời gian', () => {
  it('giữ thứ tự, gửi cursor nguyên vẹn, limit 50, no-store và signal', async () => {
    const calls: Request[] = [];
    const repository = createTimelineRepository(
      createClient<paths>({
        baseUrl: 'https://test.local',
        fetch: async (request) => {
          calls.push(request);
          return Response.json(page);
        },
      }),
    );
    const controller = new AbortController();
    expect(await repository.list(profileId, null, controller.signal)).toEqual(page);
    expect(await repository.list(profileId, 'a+/=cursor', controller.signal)).toEqual(page);
    const first = new URL(calls[0]!.url);
    expect(first.pathname).toBe(`/api/health-profiles/${profileId}/timeline`);
    expect(first.searchParams.get('limit')).toBe('50');
    expect(first.searchParams.has('cursor')).toBe(false);
    expect(new URL(calls[1]!.url).searchParams.get('cursor')).toBe('a+/=cursor');
    expect(calls.every((call) => call.method === 'GET' && call.cache === 'no-store')).toBe(true);
    controller.abort();
    expect(calls.every((call) => call.signal.aborted)).toBe(true);
  });
  it.each([401, 403, 404, 409, 422, 500])('giữ status %s, che lỗi nội bộ', async (status) => {
    const repository = createTimelineRepository(
      createClient<paths>({
        baseUrl: 'https://test.local',
        fetch: async () =>
          Response.json({ error: { code: 'ERR_NOT_FOUND', message: 'Không tìm thấy hồ sơ.' } }, { status }),
      }),
    );
    await expect(repository.list(profileId, null)).rejects.toMatchObject({
      status,
      message: status === 500 ? 'Không thể tải dòng thời gian. Vui lòng thử lại.' : 'Không tìm thấy hồ sơ.',
    });
  });
  it('từ chối phản hồi sai cấu trúc', async () => {
    const repository = createTimelineRepository(
      createClient<paths>({
        baseUrl: 'https://test.local',
        fetch: async () => Response.json({ items: [{ kind: 'unknown' }], nextCursor: null }),
      }),
    );
    await expect(repository.list(profileId, null)).rejects.toThrow();
  });
});
