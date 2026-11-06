import { expect } from 'vitest';
import type { PainIssueDetail } from '@angia/contracts';
import type { PainHttpFixture } from './painJournalHttpFixture.js';

// Cùng bộ assertion nghiệp vụ chạy qua hai cửa; transport và scope vẫn là HTTP/DB thật.
export async function painJournalScenario(t: PainHttpFixture, self: boolean) {
  const own = await t.profile();
  const user = self ? own.member : own.main;
  const base = self ? '/api/me/profile/pain-issues' : `/api/health-profiles/${own.profileId}/pain-issues`;
  const send = async (method: string, suffix: string, body: unknown, status: number) => {
    const response = await t.call(user, method, base + suffix, body);
    expect(response.status, `${method} ${suffix}: ${await response.clone().text()}`).toBe(status);
    expect(response.headers.get('cache-control')).toBe('no-store');
    return response;
  };
  const open = async (body: object = {}) => {
    const response = await send(
      'POST',
      '',
      {
        region: 'knee',
        side: 'left',
        firstEntry: { level: 6 },
        ...body,
      },
      201,
    );
    return (await response.json()) as PainIssueDetail;
  };
  const detail = async (id: string) =>
    (await (await send('GET', `/${id}`, undefined, 200)).json()) as PainIssueDetail;
  return { ...own, user, base, send, open, detail };
}
