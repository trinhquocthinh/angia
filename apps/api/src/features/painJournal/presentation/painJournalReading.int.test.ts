import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PainIssueSummary } from '@angia/contracts';
import { painEntrySchema, painIssueDetailSchema, painIssueListSchema } from '@angia/contracts';
import { painJournalHttpFixture, type PainHttpFixture } from './painJournalHttpFixture.js';
import { painJournalScenario } from './painJournalScenario.js';

describe.each([false, true])('Đọc sổ đau nhức qua HTTP, self=%s', (self) => {
  let t: PainHttpFixture;
  beforeAll(async () => {
    t = await painJournalHttpFixture();
  });
  afterAll(async () => t?.stop());

  it('TC-669: tracking trước, rồi lần ghi giảm dần; lọc đủ trạng thái và từ chối giá trị sai', async () => {
    const s = await painJournalScenario(t, self);
    const older = await s.open({ firstEntry: { level: 3, recordedAt: '2026-11-03T00:00:00Z' } });
    await s.send('POST', `/${older.id}/resolve`, { resolvedOn: '2026-11-06' }, 200);
    const newer = await s.open({ firstEntry: { level: 4, recordedAt: '2026-11-05T00:00:00Z' } });
    await s.send('POST', `/${newer.id}/resolve`, { resolvedOn: '2026-11-06' }, 200);
    const tracking = await s.open({ firstEntry: { level: 2, recordedAt: '2026-11-01T00:00:00Z' } });
    for (const [query, ids] of [
      ['', [tracking.id, newer.id, older.id]],
      ['?status=all', [tracking.id, newer.id, older.id]],
      ['?status=tracking', [tracking.id]],
      ['?status=resolved', [newer.id, older.id]],
    ] as const) {
      const value = painIssueListSchema.parse(await (await s.send('GET', query, undefined, 200)).json());
      expect(painIssueListSchema.parse(value)).toEqual(value);
      expect(value.issues.map((i: PainIssueSummary) => i.id)).toEqual(ids);
    }
    const invalid = await s.send('GET', '?status=foo', undefined, 422);
    expect(await invalid.json()).toMatchObject({ error: { code: 'ERR_VALIDATION' } });
  });

  it('TC-670: sáu lần ghi xen kẽ người tạo, cũ trước; bài tập theo ngày bắt đầu', async () => {
    const s = await painJournalScenario(t, self);
    const issue = await s.open({ firstEntry: { level: 1, recordedAt: '2026-11-01T00:00:00Z' } });
    const mainBase = `/api/health-profiles/${s.profileId}/pain-issues/${issue.id}`;
    for (let day = 2; day <= 6; day++) {
      const member = day % 2 === 0;
      const base = member ? `/api/me/profile/pain-issues/${issue.id}` : mainBase;
      const response = await t.call(member ? s.member : s.main, 'POST', `${base}/entries`, {
        level: day,
        recordedAt: `2026-11-0${day}T00:00:00Z`,
      });
      expect(response.status).toBe(201);
    }
    for (const day of ['05', '02'])
      await s.send(
        'POST',
        `/${issue.id}/exercises`,
        { name: 'Duỗi gối', source: 'self', startDate: `2026-11-${day}` },
        201,
      );
    const detail = await s.detail(issue.id);
    expect(painIssueDetailSchema.parse(detail)).toEqual(detail);
    expect(detail.entryCount).toBe(6);
    expect(detail.entries.map((e) => e.level)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(detail.entries.map((e) => e.createdBy?.accountId)).toEqual([
      s.user.accountId,
      s.member.accountId,
      s.main.accountId,
      s.member.accountId,
      s.main.accountId,
      s.member.accountId,
    ]);
    for (const entry of detail.entries) {
      expect(entry.createdBy?.displayName).toBe('Người chăm');
      expect(entry.updatedBy).toEqual(entry.createdBy);
    }
    expect(detail.exercises.map((e) => e.startDate)).toEqual(['2026-11-02', '2026-11-05']);
  });

  it('TC-674: xóa tài khoản người ghi giữ nguyên lần ghi và trả ActorRef null', async () => {
    const s = await painJournalScenario(t, self);
    const issue = await s.open();
    // Tài khoản bị xóa chỉ là người ghi; phiên đọc còn tồn tại.
    const author = await t.session(s.familyId, 'main');
    const entryResponse = await t.call(
      author,
      'POST',
      `/api/health-profiles/${s.profileId}/pain-issues/${issue.id}/entries`,
      { level: 7 },
    );
    expect(entryResponse.status).toBe(201);
    const entry = painEntrySchema.parse(await entryResponse.json());
    await t.owner.query('DELETE FROM accounts WHERE id=$1', [author.accountId]);
    const detail = await s.detail(issue.id);
    expect(detail.entryCount).toBe(2);
    expect(detail.entries.find((e) => e.id === entry.id)).toMatchObject({
      level: 7,
      createdBy: null,
      updatedBy: null,
    });
  });

  it('TC-675: hồ sơ trẻ em tắt số đo vẫn đọc đủ danh sách và chi tiết', async () => {
    const s = await painJournalScenario(t, self);
    const issue = await s.open();
    await t.owner.query('UPDATE health_profiles SET birth_year=2020,vitals_enabled=false WHERE id=$1', [
      s.profileId,
    ]);
    const list = painIssueListSchema.parse(await (await s.send('GET', '', undefined, 200)).json());
    expect(list.issues.map((i: PainIssueSummary) => i.id)).toEqual([issue.id]);
    expect((await s.detail(issue.id)).entries).toHaveLength(1);
  });
});
