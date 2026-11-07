import { expect, it } from 'vitest';
import { exerciseNoteForm } from './exerciseNoteForm';
import { initialExerciseNoteValues } from './initialExerciseNoteValues';
import { changeExerciseNoteValues } from './changeExerciseNoteValues';
const values = {
  name: 'Duỗi gối',
  source: 'prescribed' as const,
  prescriber: 'BS. An',
  startDate: '2026-11-05',
  endDate: '2026-11-10',
  note: '3 hiệp × 10 lần',
};
it('TC-692/693: không chọn sẵn nguồn, hôm nay theo giờ Việt Nam; đổi self xóa vĩnh viễn người chỉ định trong bản nháp', () => {
  expect(initialExerciseNoteValues(undefined, new Date('2026-11-06T18:00:00Z'))).toMatchObject({
    source: '',
    startDate: '2026-11-07',
  });
  const self = changeExerciseNoteValues(values, { source: 'self' });
  expect(self.prescriber).toBe('');
  expect(changeExerciseNoteValues(self, { source: 'prescribed' }).prescriber).toBe('');
  expect(exerciseNoteForm(self, false)).toEqual({
    name: 'Duỗi gối',
    source: 'self',
    startDate: '2026-11-05',
    endDate: '2026-11-10',
    note: '3 hiệp × 10 lần',
  });
});
it('TC-694: thêm bỏ ngày trống; sửa gửi null xóa ngày, giữ nguyên văn và cho xóa trắng ghi chú', () => {
  const blank = { ...values, endDate: '', note: '', prescriber: '' };
  expect(exerciseNoteForm(blank, false)).toEqual({
    name: 'Duỗi gối',
    source: 'prescribed',
    startDate: '2026-11-05',
    note: '',
    prescriber: '',
  });
  expect(exerciseNoteForm(blank, true)).toMatchObject({ endDate: null, note: '', prescriber: '' });
});
it('TC-692/694: chặn thiếu nguồn, tên trắng, ngày sai/thứ tự và quá giới hạn', () => {
  for (const patch of [
    { source: '' },
    { name: '   ' },
    { startDate: '' },
    { startDate: '2026-02-30' },
    { endDate: '2026-11-04' },
    { name: 'a'.repeat(101) },
    { note: 'a'.repeat(1001) },
    { prescriber: 'a'.repeat(101) },
  ]) {
    expect(() => exerciseNoteForm({ ...values, ...patch }, false)).toThrow();
  }
});
