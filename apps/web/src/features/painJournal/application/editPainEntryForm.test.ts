import { expect, it } from 'vitest';
import { editPainEntryForm } from './editPainEntryForm';
const values = { level: 4, recordedAt: '2026-11-06T23:30', note: '' };
const now = new Date('2026-11-07T03:00:00Z');
it('sửa lần ghi giữ giờ Việt Nam và gửi null để xóa ghi chú', () => {
  expect(editPainEntryForm(values, null, now)).toEqual({
    level: 4,
    recordedAt: '2026-11-06T16:30:00.000Z',
    note: null,
  });
});
it('sửa ghi chú không làm tròn giây của thời điểm gốc khi chưa đổi giờ', () => {
  expect(editPainEntryForm(values, null, now, '2026-11-06T16:30:45Z')).toEqual({ level: 4, note: null });
});
it('chặn mức sai, ngày sai, tương lai và giờ sau cuối ngày khỏi theo giờ Việt Nam', () => {
  for (const patch of [
    { level: 0 },
    { level: null },
    { note: 'a'.repeat(501) },
    { recordedAt: '' },
    { recordedAt: '2026-02-30T10:00' },
    { recordedAt: '2026-11-07T10:01' },
  ])
    expect(() => editPainEntryForm({ ...values, ...patch }, null, now)).toThrow();
  expect(() => editPainEntryForm(values, '2026-11-05', now)).toThrow();
  expect(editPainEntryForm({ ...values, recordedAt: '2026-11-06T23:59' }, '2026-11-06', now)).toBeTruthy();
});
