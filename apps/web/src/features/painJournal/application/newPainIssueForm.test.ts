import { describe, expect, it } from 'vitest';
import { newPainIssueFormSchema } from './newPainIssueForm';
const now = new Date('2026-11-07T03:00:00Z');
const values = { title: '', level: 6, note: '', recordedAt: '' };
describe('E21-S2-T2 — lần ghi đầu', () => {
  it('không chọn sẵn mức; giới hạn tên và ghi chú', () => {
    const schema = newPainIssueFormSchema(now);
    for (const patch of [
      { level: null },
      { level: 0 },
      { level: 11 },
      { title: 'a'.repeat(61) },
      { note: 'a'.repeat(501) },
    ]) {
      expect(schema.safeParse({ ...values, ...patch }).success).toBe(false);
    }
    expect(schema.parse(values)).toEqual({ title: '', firstEntry: { level: 6 } });
  });
  it('đổi giờ Việt Nam sang UTC, từ chối ngày lịch sai và tương lai', () => {
    const schema = newPainIssueFormSchema(now);
    expect(schema.parse({ ...values, recordedAt: '2026-11-07T09:00', note: ' Sau đi bộ ' })).toEqual({
      title: '',
      firstEntry: { level: 6, recordedAt: '2026-11-07T02:00:00.000Z', note: 'Sau đi bộ' },
    });
    for (const recordedAt of ['2026-02-30T09:00', '2026-11-07T10:01', 'invalid'])
      expect(schema.safeParse({ ...values, recordedAt }).success).toBe(false);
  });
});
