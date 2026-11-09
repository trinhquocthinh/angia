import createClient from 'openapi-fetch';
import { describe, expect, it } from 'vitest';
import type { paths } from '@src/shared/api/schema.gen';
import { issue } from '../test/painIssues.test-helper';
import { createPainJournalApi } from './painJournalApi';

const make = (fetch: (request: Request) => Promise<Response>) =>
  createPainJournalApi(createClient<paths>({ baseUrl: 'https://test.local', fetch }));
describe('E21-S2-T1 — adapter sổ đau nhức', () => {
  it('đọc đúng main/self, bộ lọc, no-store và hủy yêu cầu', async () => {
    const requests: Request[] = [];
    const api = make(async (request) => {
      requests.push(request);
      return Response.json({ issues: [issue] });
    });
    const controller = new AbortController();
    expect(await api.list(issue.id, { status: 'tracking' }, controller.signal)).toEqual({ issues: [issue] });
    await api.list(null, { status: 'all' });
    expect(requests.map((request) => request.url)).toEqual([
      `https://test.local/api/health-profiles/${issue.id}/pain-issues?status=tracking`,
      'https://test.local/api/me/profile/pain-issues?status=all',
    ]);
    expect(requests.every((request) => request.cache === 'no-store')).toBe(true);
    controller.abort();
    expect(requests[0]!.signal.aborted).toBe(true);
  });
  it('giữ lỗi quyền và che nội dung server; từ chối DTO sai', async () => {
    await expect(
      make(async () =>
        Response.json(
          {
            error: {
              code: 'ERR_CONSENT_REQUIRED',
              message: 'Cần đồng thuận',
            },
          },
          { status: 409 },
        ),
      ).list(null, { status: 'all' }),
    ).rejects.toMatchObject({
      status: 409,
      code: 'ERR_CONSENT_REQUIRED',
    });
    await expect(
      make(async () => new Response('secret', { status: 500 })).list(null, { status: 'all' }),
    ).rejects.toThrow('Không thể tải sổ đau nhức. Vui lòng thử lại.');
    await expect(
      make(async () => Response.json({ issues: [{}] })).list(null, { status: 'all' }),
    ).rejects.toThrow();
  });
});
