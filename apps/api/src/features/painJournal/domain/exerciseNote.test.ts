import { describe, expect, it } from 'vitest';
import { prepareExerciseNote, type ExerciseNote } from './exerciseNote.js';

const exercise: ExerciseNote = {
  name: 'Duỗi gối',
  source: 'prescribed',
  prescriber: 'BS. An',
  startDate: '2026-11-05',
  endDate: null,
  note: '3 hiệp × 10 lần',
};
const invalid = { ok: false, code: 'ERR_VALIDATION' };

describe('Bài tập — BR-061', () => {
  it('TC-692: giữ nguyên văn bài tập do chuyên viên chỉ định', () => {
    expect(prepareExerciseNote(exercise, 'create')).toEqual({ ok: true, value: exercise });
  });

  it.each([null, ''])('TC-693: tự ghi không có người chỉ định hợp lệ với giá trị %s', (prescriber) => {
    const value = { ...exercise, source: 'self', prescriber: null } as const;
    expect(prepareExerciseNote({ ...value, prescriber }, 'create')).toEqual(
      prescriber === null ? { ok: true, value } : invalid,
    );
  });

  it('TC-693: không tạo bài tự ghi có người chỉ định', () => {
    expect(prepareExerciseNote({ ...exercise, source: 'self' }, 'create')).toEqual(invalid);
  });

  it('TC-693: khi sửa sang tự ghi thì xóa người chỉ định, không sửa đầu vào', () => {
    const value = { ...exercise, source: 'self' } as const;
    const before = structuredClone(value);
    expect(prepareExerciseNote(value, 'update')).toEqual({
      ok: true,
      value: { ...value, prescriber: null },
    });
    expect(value).toEqual(before);
  });

  it('TC-692: bài chỉ định không bắt buộc có người chỉ định', () => {
    const value = { ...exercise, prescriber: null };
    expect(prepareExerciseNote(value, 'create')).toEqual({ ok: true, value });
  });

  it.each(['create', 'update'] as const)('TC-694: %s từ chối ngày kết thúc trước ngày bắt đầu', (kind) => {
    expect(prepareExerciseNote({ ...exercise, endDate: '2026-11-04' }, kind)).toEqual(invalid);
  });

  it.each(['2026-11-05', '2026-12-01'])('TC-694: chấp nhận ngày kết thúc %s', (endDate) => {
    const value = { ...exercise, endDate };
    expect(prepareExerciseNote(value, 'create')).toEqual({ ok: true, value });
  });

  it.each(['2026-02-30', '2026-13-01', '05/11/2026', ''])(
    'TC-694: từ chối ngày bắt đầu sai %s',
    (startDate) => {
      expect(prepareExerciseNote({ ...exercise, startDate }, 'create')).toEqual(invalid);
    },
  );

  it('TC-694: từ chối ngày kết thúc sai', () => {
    expect(prepareExerciseNote({ ...exercise, endDate: '2026-11-31' }, 'update')).toEqual(invalid);
  });

  it('TC-694: từ chối tên rỗng', () => {
    expect(prepareExerciseNote({ ...exercise, name: '' }, 'create')).toEqual(invalid);
  });
});
