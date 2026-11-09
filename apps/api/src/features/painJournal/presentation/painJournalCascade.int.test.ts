import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedPendingDocument } from '@src/shared/test/seedPendingDocument.js';
import { manualReading } from '@src/shared/test/healthDataFixtures.js';
import { snapshotHealthTables } from '@src/shared/test/snapshotHealthTables.js';
import { painJournalHttpFixture, type PainHttpFixture } from './painJournalHttpFixture.js';
import { painJournalScenario } from './painJournalScenario.js';

const tables = ['pain_issues', 'pain_entries', 'exercise_notes', 'pain_issue_status_events'];

describe('Cascade sổ đau nhức qua HTTP và DB thật', () => {
  let t: PainHttpFixture;
  beforeAll(async () => {
    t = await painJournalHttpFixture();
  });
  afterAll(async () => t?.stop());

  it.each([false, true])(
    'TC-687: tác động xóa 5 lần ghi/2 bài tập, xóa cả sự kiện, self=%s',
    async (self) => {
      const s = await painJournalScenario(t, self);
      const issue = await s.open();
      const sibling = await t.profile(s.familyId);
      await t.issue(sibling);
      for (let i = 0; i < 4; i++) await s.send('POST', `/${issue.id}/entries`, { level: 4 }, 201);
      for (let i = 0; i < 2; i++)
        await s.send(
          'POST',
          `/${issue.id}/exercises`,
          { name: 'Duỗi gối', source: 'self', startDate: '2026-11-05' },
          201,
        );
      await s.send('POST', `/${issue.id}/resolve`, { resolvedOn: '2026-11-06' }, 200);
      await s.send('POST', `/${issue.id}/reopen`, {}, 200);
      expect((await s.detail(issue.id)).statusEvents).toHaveLength(2);
      const impact = await s.send('GET', `/${issue.id}/deletion-impact`, undefined, 200);
      expect(await impact.json()).toEqual({ entryCount: 5, exerciseCount: 2 });
      const before = await snapshotHealthTables(t.owner);
      await s.send('DELETE', `/${issue.id}`, { confirm: true }, 204);
      await s.send('GET', `/${issue.id}`, undefined, 404);
      const after = await snapshotHealthTables(t.owner);
      for (const table of tables) {
        expect(
          (await t.owner.query(`SELECT id FROM ${table} WHERE health_profile_id=$1`, [s.profileId])).rows,
        ).toEqual([]);
        const others = (rows: unknown) =>
          (rows as { health_profile_id: string }[]).filter((r) => r.health_profile_id !== s.profileId);
        expect(others(after[table])).toEqual(others(before[table]));
      }
    },
  );

  it('TC-718: xóa hồ sơ dọn 2 vấn đề/6 lần ghi/3 bài tập/2 sự kiện, giữ hồ sơ khác', async () => {
    const s = await painJournalScenario(t, false);
    const sibling = await t.profile(s.familyId);
    const foreign = await t.profile();
    await t.issue(sibling);
    await t.issue(foreign);
    const first = await s.open();
    const second = await s.open({ side: 'right' });
    for (const issue of [first, second]) {
      for (let i = 0; i < 2; i++) await s.send('POST', `/${issue.id}/entries`, { level: 4 }, 201);
      await s.send(
        'POST',
        `/${issue.id}/exercises`,
        { name: 'Duỗi gối', source: 'self', startDate: '2026-11-05' },
        201,
      );
    }
    await s.send(
      'POST',
      `/${first.id}/exercises`,
      { name: 'Co gối', source: 'self', startDate: '2026-11-06' },
      201,
    );
    await s.send('POST', `/${first.id}/resolve`, { resolvedOn: '2026-11-06' }, 200);
    await s.send('POST', `/${first.id}/reopen`, {}, 200);
    const before = await snapshotHealthTables(t.owner);
    const ofProfile = (rows: unknown) =>
      (rows as { health_profile_id: string }[]).filter((r) => r.health_profile_id === s.profileId);
    expect(tables.map((table) => ofProfile(before[table]).length)).toEqual([2, 6, 3, 2]);
    const response = await t.call(s.main, 'DELETE', `/api/health-profiles/${s.profileId}`, {
      confirmName: 'Mẹ',
    });
    expect(response.status).toBe(204);
    const after = await snapshotHealthTables(t.owner);
    for (const table of tables) {
      expect(ofProfile(after[table])).toEqual([]);
      const others = (rows: unknown) =>
        (rows as { health_profile_id: string }[]).filter((r) => r.health_profile_id !== s.profileId);
      expect(others(after[table])).toEqual(others(before[table]));
    }
    expect((await t.owner.query('SELECT id FROM health_profiles WHERE id=$1', [s.profileId])).rows).toEqual(
      [],
    );
  });

  it('TC-719: xóa chứng từ đã duyệt không đổi bất kỳ dòng sổ đau nhức nào', async () => {
    const s = await painJournalScenario(t, false);
    const issue = await s.open();
    await s.send(
      'POST',
      `/${issue.id}/exercises`,
      { name: 'Duỗi gối', source: 'self', startDate: '2026-11-05' },
      201,
    );
    await s.send('POST', `/${issue.id}/resolve`, { resolvedOn: '2026-11-06' }, 200);
    const owner = { familyId: s.familyId, profileId: s.profileId, accountId: s.main.accountId };
    const { documentId } = await seedPendingDocument(t, owner, manualReading);
    const approved = await t.call(s.main, 'POST', `/api/source-documents/${documentId}/approve`, {
      type: 'device_reading',
      data: manualReading,
    });
    expect(approved.status).toBe(200);
    const before = await snapshotHealthTables(t.owner);
    const response = await t.call(s.main, 'DELETE', `/api/source-documents/${documentId}`, {
      confirm: 'XÓA',
    });
    expect(response.status).toBe(204);
    expect((await t.owner.query('SELECT id FROM source_documents WHERE id=$1', [documentId])).rows).toEqual(
      [],
    );
    const after = await snapshotHealthTables(t.owner);
    for (const table of tables) expect(after[table]).toEqual(before[table]);
  });
});
