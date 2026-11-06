import { describe, expect, it } from 'vitest';
import { createPainEntry } from './createPainEntry.js';
import { updatePainEntry } from './updatePainEntry.js';
import { deletePainEntry } from './deletePainEntry.js';
import { createExerciseNote } from './createExerciseNote.js';
import { updateExerciseNote } from './updateExerciseNote.js';
import { deleteExerciseNote } from './deleteExerciseNote.js';
import { getPainContext } from './getPainContext.js';
import { entry, exercise, issue, now, painIssueFixture, session, summary } from './painIssueTestFixture.js';
import type { PainIssueRepository } from './ports.js';

const entryTarget = { ...session, entryId: 'entry-1' };
const exerciseTarget = { ...session, exerciseId: 'exercise-1' };
const operations = [
  { name: 'thêm lần ghi', run: (r: PainIssueRepository) => createPainEntry(r, session, null, now) },
  { name: 'sửa lần ghi', run: (r: PainIssueRepository) => updatePainEntry(r, entryTarget, null, now) },
  { name: 'xóa lần ghi', run: (r: PainIssueRepository) => deletePainEntry(r, entryTarget) },
  { name: 'thêm bài tập', run: (r: PainIssueRepository) => createExerciseNote(r, session, null, now) },
  { name: 'sửa bài tập', run: (r: PainIssueRepository) => updateExerciseNote(r, exerciseTarget, null, now) },
  { name: 'xóa bài tập', run: (r: PainIssueRepository) => deleteExerciseNote(r, exerciseTarget) },
  { name: 'bối cảnh', run: (r: PainIssueRepository) => getPainContext(r, session, null, now) },
];

describe('Phạm vi và consent của use case T2', () => {
  it.each(operations)('TC-666: $name từ chối vấn đề ngoài phạm vi trước body', async ({ run }) => {
    const { repository, store } = painIssueFixture();
    store.findIssue.mockResolvedValue(null);
    expect(await run(repository)).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
    expect(store.insertEntry).not.toHaveBeenCalled();
    expect(store.insertExercise).not.toHaveBeenCalled();
    expect(store.readContext).not.toHaveBeenCalled();
    expect(store.deleteEntry).not.toHaveBeenCalled();
    expect(store.deleteExercise).not.toHaveBeenCalled();
  });

  it.each(operations)('TC-665: $name kiểm consent trước body', async ({ run }) => {
    const { repository, store } = painIssueFixture();
    store.findIssue.mockResolvedValue({
      issue,
      consentStatus: 'withdrawn',
      lastRecordedAt: summary.lastEntry.recordedAt,
    });
    expect(await run(repository)).toEqual({ ok: false, code: 'ERR_CONSENT_REQUIRED' });
    expect(store.updateEntry).not.toHaveBeenCalled();
    expect(store.updateExercise).not.toHaveBeenCalled();
    expect(store.readContext).not.toHaveBeenCalled();
    expect(store.deleteEntry).not.toHaveBeenCalled();
    expect(store.deleteExercise).not.toHaveBeenCalled();
  });

  it.each(operations.slice(1, 3))('TC-682: $name kiểm ID con trước consent', async ({ run }) => {
    const { repository, store } = painIssueFixture();
    store.findEntry.mockResolvedValue(null);
    store.findIssue.mockResolvedValue({
      issue,
      consentStatus: 'withdrawn',
      lastRecordedAt: summary.lastEntry.recordedAt,
    });
    expect(await run(repository)).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
    expect(store.findEntry).toHaveBeenCalledWith(session.profileId, session.issueId, 'entry-1');
    expect(store.updateEntry).not.toHaveBeenCalled();
    expect(store.deleteEntry).not.toHaveBeenCalled();
  });

  it.each(operations.slice(4, 6))('TC-698: $name kiểm ID bài tập trước consent', async ({ run }) => {
    const { repository, store } = painIssueFixture();
    store.findExercise.mockResolvedValue(null);
    store.findIssue.mockResolvedValue({
      issue,
      consentStatus: 'withdrawn',
      lastRecordedAt: summary.lastEntry.recordedAt,
    });
    expect(await run(repository)).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
    expect(store.findExercise).toHaveBeenCalledWith(session.profileId, session.issueId, 'exercise-1');
    expect(store.updateExercise).not.toHaveBeenCalled();
    expect(store.deleteExercise).not.toHaveBeenCalled();
  });

  it('TC-682: port trả sai ID con vẫn bị từ chối', async () => {
    const { repository, store } = painIssueFixture();
    store.findEntry.mockResolvedValue({ ...entry, id: 'other' });
    store.findExercise.mockResolvedValue({ ...exercise, id: 'other' });
    expect(await updatePainEntry(repository, entryTarget, {}, now)).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
    expect(await deletePainEntry(repository, entryTarget)).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
    expect(await updateExerciseNote(repository, exerciseTarget, {}, now)).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
    expect(await deleteExerciseNote(repository, exerciseTarget)).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
  });
  it.each(operations)('TC-666: $name kiểm lại hồ sơ và ID vấn đề dù port trả nhầm', async ({ run }) => {
    const { repository, store } = painIssueFixture();
    for (const wrongIssue of [
      { ...issue, healthProfileId: 'other-profile' },
      { ...issue, id: 'other-issue' },
    ]) {
      store.findIssue.mockResolvedValue({
        issue: wrongIssue,
        consentStatus: 'withdrawn',
        lastRecordedAt: summary.lastEntry.recordedAt,
      });
      expect(await run(repository)).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
    }
    expect(store.findEntry).not.toHaveBeenCalled();
    expect(store.findExercise).not.toHaveBeenCalled();
    expect(store.readContext).not.toHaveBeenCalled();
  });
});
