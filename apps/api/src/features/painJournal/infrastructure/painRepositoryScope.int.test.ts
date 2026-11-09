import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  painNow,
  painRepositoryFixture,
  unwrapPain,
  type PainRepositoryFixture,
} from './painRepositoryFixture.js';
import { openPainIssue } from '../application/openPainIssue.js';
import { getPainIssue } from '../application/getPainIssue.js';
import { updatePainEntry } from '../application/updatePainEntry.js';
import { deletePainEntry } from '../application/deletePainEntry.js';
import { createExerciseNote } from '../application/createExerciseNote.js';
import { updateExerciseNote } from '../application/updateExerciseNote.js';
import { deleteExerciseNote } from '../application/deleteExerciseNote.js';

describe('Scope repository sổ đau nhức', () => {
  let t: PainRepositoryFixture;
  beforeAll(async () => {
    t = await painRepositoryFixture();
  });
  afterAll(async () => {
    await t?.stop();
  });

  it('TC-682: sai vấn đề không đọc/sửa/xóa được lần ghi và bài tập cùng hồ sơ', async () => {
    const session = await t.profile();
    const first = await t.open(session);
    const second = await t.open(session, 'right');
    const exercise = unwrapPain(
      await createExerciseNote(
        t.repository,
        { ...session, issueId: second.id },
        {
          name: 'Duỗi gối',
          source: 'self',
          startDate: '2026-11-05',
        },
        painNow,
      ),
    );
    const wrongEntry = { ...session, issueId: first.id, entryId: second.entries[0]!.id };
    const wrongExercise = { ...session, issueId: first.id, exerciseId: exercise.id };
    for (const result of [
      await updatePainEntry(t.repository, wrongEntry, { level: 2 }, painNow),
      await deletePainEntry(t.repository, wrongEntry),
      await updateExerciseNote(t.repository, wrongExercise, { name: 'Khác' }, painNow),
      await deleteExerciseNote(t.repository, wrongExercise),
    ])
      expect(result).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
    const detail = unwrapPain(await getPainIssue(t.repository, { ...session, issueId: second.id }));
    expect(detail.entries[0]!.level).toBe(6);
    expect(detail.exercises).toEqual([exercise]);
  });

  it('TC-698/699: self scope ghi được chính mình, chặn hồ sơ cùng nhà và khác nhà', async () => {
    const own = await t.profile();
    const sibling = await t.profile(own.familyId);
    const foreign = await t.profile();
    const self = t.self(own.profileId);
    const created = unwrapPain(
      await openPainIssue(
        self,
        own,
        {
          region: 'knee',
          side: 'left',
          firstEntry: { level: 4 },
        },
        painNow,
      ),
    );
    expect(created.createdBy?.accountId).toBe(own.accountId);
    const ownTarget = { ...own, issueId: created.id };
    expect(
      unwrapPain(
        await updatePainEntry(
          self,
          {
            ...ownTarget,
            entryId: created.entries[0]!.id,
          },
          { level: 3 },
          painNow,
        ),
      ).level,
    ).toBe(3);
    const exercise = unwrapPain(
      await createExerciseNote(
        self,
        ownTarget,
        {
          name: 'Duỗi gối',
          source: 'self',
          startDate: '2026-11-05',
        },
        painNow,
      ),
    );
    const exerciseTarget = { ...ownTarget, exerciseId: exercise.id };
    expect(unwrapPain(await updateExerciseNote(self, exerciseTarget, { name: 'Co gối' }, painNow)).name).toBe(
      'Co gối',
    );
    expect(await deleteExerciseNote(self, exerciseTarget)).toEqual({ ok: true, value: null });
    for (const other of [sibling, foreign]) {
      const issue = await t.open(other);
      const target = { ...own, profileId: other.profileId, issueId: issue.id };
      expect(await getPainIssue(self, target)).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
      expect(
        await updatePainEntry(self, { ...target, entryId: issue.entries[0]!.id }, { level: 1 }, painNow),
      ).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
      expect(await getPainIssue(t.repository, { ...own, issueId: issue.id })).toEqual({
        ok: false,
        code: 'ERR_NOT_FOUND',
      });
      expect(
        unwrapPain(await getPainIssue(t.repository, { ...other, issueId: issue.id })).entries[0]!.level,
      ).toBe(6);
    }
    const role = await t.pool.query('SELECT rolbypassrls FROM pg_roles WHERE rolname=current_user');
    expect(role.rows[0].rolbypassrls).toBe(false);
  });
});
