import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PainIssueDetail } from '@angia/contracts';
import { painJournalOperations } from '@src/shared/test/painJournalOperations.js';
import { painJournalHttpFixture, painPath, type PainHttpFixture } from './painJournalHttpFixture.js';

describe('Route sổ đau nhức hai cửa', () => {
  let t: PainHttpFixture;
  beforeAll(async () => {
    t = await painJournalHttpFixture();
  });
  afterAll(async () => t?.stop());

  it.each([false, true])('SPEC-052–057: đủ 15 thao tác qua cửa self=%s', async (self) => {
    const own = await t.profile();
    const user = self ? own.member : own.main;
    const base = self ? '/api/me/profile/pain-issues' : `/api/health-profiles/${own.profileId}/pain-issues`;
    for (const [method, suffix, body, status] of painJournalOperations) {
      const target = await t.issue(own);
      if (suffix.endsWith('/reopen'))
        await t.call(user, 'POST', `${base}/${target.issueId}/resolve`, { resolvedOn: '2026-11-06' });
      const response = await t.call(user, method, painPath(base, suffix, target), body);
      expect(response.status, `${method} ${suffix}: ${await response.clone().text()}`).toBe(status);
      expect(response.headers.get('cache-control')).toBe('no-store');
      // Mỗi operation dùng vấn đề riêng, tránh phụ thuộc thứ tự và xung đột vùng.
      await t.owner.query('DELETE FROM pain_issues WHERE health_profile_id=$1', [own.profileId]);
    }
  });

  it('SPEC-057: root POST cố chọn hồ sơ khác trả 404 trước validation', async () => {
    const own = await t.profile();
    const response = await t.call(own.member, 'POST', '/api/me/profile/pain-issues', {
      profileId: randomUUID(),
      firstEntry: { level: 99 },
    });
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_NOT_FOUND' } });
  });

  it('SPEC-052–057: phạm vi → consent → input; JSON hỏng không lộ tài nguyên, details lỗi được giữ', async () => {
    const own = await t.profile();
    const target = await t.issue(own);
    const base = `/api/health-profiles/${own.profileId}/pain-issues`;
    const malformed = (path: string) =>
      t.app.request(path, {
        method: 'PATCH',
        headers: {
          cookie: own.main.cookie,
          'x-csrf-token': own.main.csrf,
          'content-type': 'application/json',
        },
        body: '{',
      });
    expect((await malformed(`${base}/${randomUUID()}`)).status).toBe(404);
    expect((await t.call(own.member, 'POST', '/api/me/consent/withdraw', {})).status).toBe(200);
    expect((await malformed(`${base}/${target.issueId}`)).status).toBe(409);
    await t.owner.query("UPDATE health_profiles SET consent_status='confirmed' WHERE id=$1", [own.profileId]);
    expect((await malformed(`${base}/${target.issueId}`)).status).toBe(422);
    const conflict = await t.call(own.main, 'POST', base, {
      region: 'knee',
      side: 'left',
      firstEntry: { level: 5 },
    });
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toMatchObject({
      error: { code: 'ERR_PAIN_ISSUE_EXISTS', details: { existingIssueId: target.issueId } },
    });
    const detail = (await (
      await t.call(own.main, 'GET', `${base}/${target.issueId}`)
    ).json()) as PainIssueDetail;
    await t.call(own.main, 'DELETE', `${base}/${target.issueId}/entries/${detail.entries[1]!.id}`);
    const last = await t.call(own.main, 'DELETE', `${base}/${target.issueId}/entries/${target.entryId}`);
    expect(last.status).toBe(422);
    expect(await last.json()).toMatchObject({ error: { details: { reason: 'last_entry' } } });
  });
});
