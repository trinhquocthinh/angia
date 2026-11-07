import createClient from 'openapi-fetch';
import { describe, expect, it } from 'vitest';
import type { paths } from '@src/shared/api/schema.gen';
import { issue } from '../test/painIssues.test-helper';
import { createPainJournalApi } from './painJournalApi';
const body = { region: 'knee' as const, side: 'left' as const, firstEntry: { level: 6 } };
const detail = { ...issue, entries: [], exercises: [], statusEvents: [] };
const make = (fetch: (request: Request) => Promise<Response>) =>
  createPainJournalApi(createClient<paths>({ baseUrl: 'https://test.local', fetch }));
describe('E21-S2-T2 — adapter tạo vấn đề', () => {
  it('gửi POST main/self, CSRF, no-store, body hợp đồng và AbortSignal', async () => {
    const requests: Request[] = [];
    const api = make(async (request) => {
      requests.push(request);
      return Response.json(detail, { status: 201 });
    });
    const controller = new AbortController();
    expect(await api.create(issue.id, body, 'token', controller.signal)).toEqual(detail);
    await api.create(null, body, 'token');
    expect(requests.map((r) => r.url)).toEqual([
      `https://test.local/api/health-profiles/${issue.id}/pain-issues`,
      'https://test.local/api/me/profile/pain-issues',
    ]);
    for (const request of requests) {
      expect(request.method).toBe('POST');
      expect(request.headers.get('X-CSRF-Token')).toBe('token');
      expect(request.cache).toBe('no-store');
      expect(await request.json()).toEqual(body);
    }
    controller.abort();
    expect(requests[0]!.signal.aborted).toBe(true);
  });
  it('TC-728 — giữ existingIssueId hợp lệ; không chấp nhận ID hỏng hay chi tiết lỗi 500', async () => {
    for (const [status, id, expected] of [
      [409, issue.id, issue.id],
      [409, 'bad', undefined],
      [500, issue.id, undefined],
    ] as const) {
      const api = make(async () =>
        Response.json(
          { error: { code: 'ERR_PAIN_ISSUE_EXISTS', message: 'secret', details: { existingIssueId: id } } },
          { status },
        ),
      );
      await expect(api.create(null, body, 'csrf')).rejects.toMatchObject({
        status,
        existingIssueId: expected,
      });
      if (status === 500)
        await expect(api.create(null, body, 'csrf')).rejects.toThrow(
          'Không thể lưu vấn đề đau. Vui lòng thử lại.',
        );
    }
  });
  it('từ chối phản hồi sai hợp đồng và giữ mã lỗi đồng thuận', async () => {
    await expect(make(async () => Response.json({})).create(null, body, 'csrf')).rejects.toThrow();
    await expect(
      make(async () =>
        Response.json(
          { error: { code: 'ERR_CONSENT_REQUIRED', message: 'Cần đồng thuận' } },
          { status: 409 },
        ),
      ).create(null, body, 'csrf'),
    ).rejects.toMatchObject({ code: 'ERR_CONSENT_REQUIRED', status: 409 });
  });
});
