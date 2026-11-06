import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { snapshotHealthTables } from '@src/shared/test/snapshotHealthTables.js';
import { painJournalHttpFixture, type PainHttpFixture } from './painJournalHttpFixture.js';
import { painJournalScenario } from './painJournalScenario.js';

describe.each([false, true])('Vòng đời vấn đề đau qua HTTP, self=%s', (self) => {
  let t: PainHttpFixture;
  beforeAll(async () => {
    t = await painJournalHttpFixture();
  });
  afterAll(async () => t?.stop());

  it('TC-676/677/678: thêm lần ghi cập nhật summary; đã đóng chặn thêm; không xóa lần cuối', async () => {
    const s = await painJournalScenario(t, self);
    const issue = await s.open({ firstEntry: { level: 6, recordedAt: '2026-11-05T00:00:00Z' } });
    const last = await s.send('DELETE', `/${issue.id}/entries/${issue.entries[0]!.id}`, undefined, 422);
    expect(await last.json()).toMatchObject({
      error: { code: 'ERR_VALIDATION', details: { reason: 'last_entry' } },
    });
    await s.send('POST', `/${issue.id}/entries`, { level: 4 }, 201);
    expect(await s.detail(issue.id)).toMatchObject({ entryCount: 2, lastEntry: { level: 4 } });
    await s.send('POST', `/${issue.id}/resolve`, { resolvedOn: '2026-11-06' }, 200);
    const before = await snapshotHealthTables(t.owner);
    const response = await s.send('POST', `/${issue.id}/entries`, { level: 3 }, 409);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_INVALID_STATE_TRANSITION' } });
    expect(await snapshotHealthTables(t.owner)).toEqual(before);
  });

  it('TC-680/700: main và self sửa lần ghi của nhau, giữ createdBy rồi xóa được', async () => {
    const s = await painJournalScenario(t, self);
    const issue = await s.open();
    const other = self ? s.main : s.member;
    const base = self ? `/api/health-profiles/${s.profileId}/pain-issues` : '/api/me/profile/pain-issues';
    const path = `${base}/${issue.id}/entries/${issue.entries[0]!.id}`;
    await t.owner.query("UPDATE pain_entries SET updated_at='2026-11-05T00:00:00Z' WHERE id=$1", [
      issue.entries[0]!.id,
    ]);
    const response = await t.call(other, 'PATCH', path, { level: 7 });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      level: 7,
      createdBy: { accountId: s.user.accountId },
      updatedBy: { accountId: other.accountId },
      updatedAt: '2026-11-06T10:00:00.000Z',
    });
    await s.send('POST', `/${issue.id}/entries`, { level: 2 }, 201);
    expect((await t.call(other, 'DELETE', path)).status).toBe(204);
    expect((await s.detail(issue.id)).entryCount).toBe(1);
  });

  it('TC-684: ngày đóng dùng ngày VN của lần ghi muộn nhất và không vượt hôm nay', async () => {
    const s = await painJournalScenario(t, self);
    for (const [resolvedOn, status] of [
      ['2026-11-04', 422],
      ['2026-11-05', 200],
      ['2026-11-06', 200],
      ['2026-11-07', 422],
    ] as const) {
      const issue = await s.open({ firstEntry: { level: 5, recordedAt: '2026-11-05T15:00:00Z' } });
      const before = await snapshotHealthTables(t.owner);
      const response = await s.send('POST', `/${issue.id}/resolve`, { resolvedOn }, status);
      if (status === 422) {
        expect(await response.json()).toMatchObject({ error: { code: 'ERR_VALIDATION' } });
        expect(await snapshotHealthTables(t.owner)).toEqual(before);
      } else
        expect((await s.detail(issue.id)).statusEvents).toMatchObject([{ kind: 'resolved', on: resolvedOn }]);
      await s.send('DELETE', `/${issue.id}`, { confirm: true }, 204);
    }
    const issue = await s.open({ firstEntry: { level: 5, recordedAt: '2026-11-05T17:00:00Z' } });
    await s.send('POST', `/${issue.id}/resolve`, { resolvedOn: '2026-11-05' }, 422);
  });

  it('TC-685/689: đổi vùng và mở lại giữ bất biến một tracking, resolved không chiếm chỗ', async () => {
    const s = await painJournalScenario(t, self);
    const left = await s.open();
    const right = await s.open({ side: 'right' });
    const before = await snapshotHealthTables(t.owner);
    const conflict = await s.send('PATCH', `/${right.id}`, { side: 'left' }, 409);
    expect(await conflict.json()).toMatchObject({
      error: { code: 'ERR_PAIN_ISSUE_EXISTS', details: { existingIssueId: left.id } },
    });
    expect(await snapshotHealthTables(t.owner)).toEqual(before);
    await s.send('POST', `/${left.id}/resolve`, { resolvedOn: '2026-11-06' }, 200);
    await s.send('PATCH', `/${left.id}`, { side: 'right' }, 200);
    const resolved = await snapshotHealthTables(t.owner);
    const reopen = await s.send('POST', `/${left.id}/reopen`, {}, 409);
    expect(await reopen.json()).toMatchObject({
      error: { code: 'ERR_PAIN_ISSUE_EXISTS', details: { existingIssueId: right.id } },
    });
    expect(await snapshotHealthTables(t.owner)).toEqual(resolved);
    await s.send('PATCH', `/${right.id}`, { title: 'Gối phải' }, 200);
    expect((await s.detail(right.id)).title).toBe('Gối phải');
  });

  it('TC-686/688: chuyển sai trạng thái không ghi sự kiện; đóng/mở lại ghi đúng lịch sử và actor', async () => {
    const s = await painJournalScenario(t, self);
    const issue = await s.open({ firstEntry: { level: 4, recordedAt: '2026-11-05T00:00:00Z' } });
    let before = await snapshotHealthTables(t.owner);
    const invalid = await s.send('POST', `/${issue.id}/reopen`, {}, 409);
    expect(await invalid.json()).toMatchObject({ error: { code: 'ERR_INVALID_STATE_TRANSITION' } });
    expect(await snapshotHealthTables(t.owner)).toEqual(before);
    await s.send('POST', `/${issue.id}/resolve`, { resolvedOn: '2026-11-05' }, 200);
    before = await snapshotHealthTables(t.owner);
    const repeated = await s.send('POST', `/${issue.id}/resolve`, { resolvedOn: '2026-11-05' }, 409);
    expect(await repeated.json()).toMatchObject({ error: { code: 'ERR_INVALID_STATE_TRANSITION' } });
    expect(await snapshotHealthTables(t.owner)).toEqual(before);
    await s.send('POST', `/${issue.id}/reopen`, {}, 200);
    const detail = await s.detail(issue.id);
    expect(detail.resolvedOn).toBeNull();
    expect(detail.statusEvents.map(({ kind, on, by }) => ({ kind, on, accountId: by?.accountId }))).toEqual([
      { kind: 'resolved', on: '2026-11-05', accountId: s.user.accountId },
      { kind: 'reopened', on: '2026-11-06', accountId: s.user.accountId },
    ]);
  });

  it('TC-690: xóa thiếu body hoặc confirm=false không đổi DB', async () => {
    const s = await painJournalScenario(t, self);
    const issue = await s.open();
    const before = await snapshotHealthTables(t.owner);
    for (const body of [undefined, { confirm: false }]) {
      const response = await s.send('DELETE', `/${issue.id}`, body, 422);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_VALIDATION' } });
      expect(await snapshotHealthTables(t.owner)).toEqual(before);
    }
  });
});
