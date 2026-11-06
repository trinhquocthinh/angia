import { describe, expect, it } from 'vitest';
import { createExerciseNote } from './createExerciseNote.js';
import { updateExerciseNote } from './updateExerciseNote.js';
import { deleteExerciseNote } from './deleteExerciseNote.js';
import { exercise, issue, now, painIssueFixture, session, summary } from './painIssueTestFixture.js';

const child = { ...session, exerciseId: 'exercise-1' };
const body = { name: 'Duỗi gối', source: 'prescribed', prescriber: 'BS. An', startDate: '2026-11-01' };
const audit = { accountId: session.accountId, at: now() };

describe('Application bài tập — SPEC-056', () => {
  it('TC-692: tạo bài tập giữ nguyên văn, chuẩn hóa trường tùy chọn và lấy audit từ phiên', async () => {
    const { repository, store } = painIssueFixture();
    expect(await createExerciseNote(repository, session, body, now)).toEqual({ ok: true, value: exercise });
    expect(store.insertExercise).toHaveBeenCalledWith(
      session.profileId,
      session.issueId,
      { ...body, endDate: null, note: null },
      audit,
    );
    expect(store.findIssue).toHaveBeenCalledWith(session.profileId, session.issueId, true);
  });

  it('TC-693: tạo self kèm người chỉ định bị từ chối; PATCH self xóa người chỉ định', async () => {
    const { repository, store } = painIssueFixture();
    expect(await createExerciseNote(repository, session, { ...body, source: 'self' }, now)).toMatchObject({
      ok: false,
      code: 'ERR_VALIDATION',
    });
    expect(store.insertExercise).not.toHaveBeenCalled();
    await updateExerciseNote(repository, child, { source: 'self', prescriber: 'Bỏ' }, now);
    expect(store.updateExercise).toHaveBeenCalledWith(
      session.profileId,
      session.issueId,
      child.exerciseId,
      {
        name: exercise.name,
        source: 'self',
        prescriber: null,
        startDate: exercise.startDate,
        endDate: exercise.endDate,
        note: exercise.note,
      },
      audit,
    );
  });

  it('TC-694: PATCH kiểm ngày sau khi ghép với bài tập hiện có', async () => {
    const { repository, store } = painIssueFixture();
    expect(await updateExerciseNote(repository, child, { startDate: '2026-11-06' }, now)).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
    });
    expect(store.updateExercise).not.toHaveBeenCalled();
  });

  it('TC-695: thêm, sửa, xóa được trên vấn đề đã khỏi', async () => {
    const { repository, store } = painIssueFixture();
    store.findIssue.mockResolvedValue({
      issue: { ...issue, status: 'resolved', resolvedOn: '2026-11-06' },
      consentStatus: 'confirmed',
      lastRecordedAt: summary.lastEntry.recordedAt,
    });
    expect(await createExerciseNote(repository, session, body, now)).toMatchObject({ ok: true });
    expect(await updateExerciseNote(repository, child, { note: 'Nguyên văn' }, now)).toMatchObject({
      ok: true,
    });
    expect(await deleteExerciseNote(repository, child)).toEqual({ ok: true, value: null });
    expect(store.deleteExercise).toHaveBeenCalledWith(session.profileId, session.issueId, child.exerciseId);
  });
});
