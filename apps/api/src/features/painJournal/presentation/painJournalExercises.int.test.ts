import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { exerciseNoteSchema } from '@angia/contracts';
import { painJournalHttpFixture, type PainHttpFixture } from './painJournalHttpFixture.js';
import { painJournalScenario } from './painJournalScenario.js';

describe.each([false, true])('Bài tập qua HTTP, self=%s', (self) => {
  let t: PainHttpFixture;
  beforeAll(async () => {
    t = await painJournalHttpFixture();
  });
  afterAll(async () => t?.stop());

  it('TC-692/695: đủ DTO nguyên văn và CRUD bài tập ở tracking/resolved', async () => {
    const s = await painJournalScenario(t, self);
    const issue = await s.open();
    for (const resolved of [false, true]) {
      if (resolved) await s.send('POST', `/${issue.id}/resolve`, { resolvedOn: '2026-11-06' }, 200);
      const response = await s.send(
        'POST',
        `/${issue.id}/exercises`,
        {
          name: 'Duỗi gối',
          source: 'prescribed',
          prescriber: 'BS. An',
          startDate: '2026-11-05',
          note: '3 hiệp × 10 lần',
        },
        201,
      );
      const raw = await response.json();
      const exercise = exerciseNoteSchema.parse(raw);
      expect(exercise).toEqual(raw);
      expect(exerciseNoteSchema.parse(exercise)).toEqual(exercise);
      expect(exercise).toMatchObject({
        name: 'Duỗi gối',
        source: 'prescribed',
        prescriber: 'BS. An',
        startDate: '2026-11-05',
        endDate: null,
        note: '3 hiệp × 10 lần',
        createdBy: { accountId: s.user.accountId },
        updatedBy: { accountId: s.user.accountId },
      });
      const updated = await s.send('PATCH', `/${issue.id}/exercises/${exercise.id}`, { source: 'self' }, 200);
      expect(await updated.json()).toMatchObject({ source: 'self', prescriber: null });
      await s.send('DELETE', `/${issue.id}/exercises/${exercise.id}`, undefined, 204);
      expect((await s.detail(issue.id)).exerciseCount).toBe(0);
    }
  });

  it('TC-700: self sửa/xóa bài tập do main tạo, giữ người tạo và đổi người sửa', async () => {
    const s = await painJournalScenario(t, self);
    const issue = await s.open();
    const mainBase = `/api/health-profiles/${s.profileId}/pain-issues/${issue.id}/exercises`;
    const created = await t.call(s.main, 'POST', mainBase, {
      name: 'Duỗi gối',
      source: 'self',
      startDate: '2026-11-05',
    });
    expect(created.status).toBe(201);
    const exercise = exerciseNoteSchema.parse(await created.json());
    const path = `/api/me/profile/pain-issues/${issue.id}/exercises/${exercise.id}`;
    const updated = await t.call(s.member, 'PATCH', path, { name: 'Co gối' });
    expect(updated.status).toBe(200);
    expect(await updated.json()).toMatchObject({
      name: 'Co gối',
      createdBy: { accountId: s.main.accountId },
      updatedBy: { accountId: s.member.accountId },
    });
    expect((await t.call(s.member, 'DELETE', path)).status).toBe(204);
    expect((await s.detail(issue.id)).exercises).toEqual([]);
  });
});
