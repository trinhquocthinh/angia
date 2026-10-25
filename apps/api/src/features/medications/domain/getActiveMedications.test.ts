import { describe, expect, it } from 'vitest';
import type { MedicationCoursePeriod } from './MedicationCoursePeriod.js';
import { getActiveMedications } from './getActiveMedications.js';

describe('getActiveMedications — SPEC-018, BR-030', () => {
  it('TC-053 — tính cả ngày bắt đầu/kết thúc, loại ngày ngoài kỳ hạn', () => {
    const courses: MedicationCoursePeriod[] = [
      { status: 'active', startDate: '2026-10-01', endDate: '2026-10-30' },
    ];
    expect(getActiveMedications(courses, '2026-09-30')).toEqual([]);
    expect(getActiveMedications(courses, '2026-10-01')).toEqual(courses);
    expect(getActiveMedications(courses, '2026-10-30')).toEqual(courses);
    expect(getActiveMedications(courses, '2026-10-31')).toEqual([]);
  });

  it('TC-054 — đợt dài hạn đã dừng từ 15/10 không xuất hiện tại 20/10', () => {
    const courses: MedicationCoursePeriod[] = [
      { status: 'stopped', startDate: '2026-10-01', endDate: '2026-10-14' },
    ];
    expect(getActiveMedications(courses, '2026-10-20')).toEqual([]);
  });

  it.each(['ended', 'stopped', 'replaced'] as const)(
    'TC-233 — trạng thái hiện tại %s vẫn giữ lịch sử trước ngày kết thúc hiệu lực',
    (status) => {
      const courses: MedicationCoursePeriod[] = [{ status, startDate: '2026-10-01', endDate: '2026-10-14' }];
      expect(getActiveMedications(courses, '2026-10-14')).toEqual(courses);
      expect(getActiveMedications(courses, '2026-10-15')).toEqual([]);
    },
  );

  it('TC-234 — đợt dài hạn có hiệu lực từ ngày bắt đầu và không tự hết hạn', () => {
    const courses: MedicationCoursePeriod[] = [{ status: 'active', startDate: '2026-10-01', endDate: null }];
    expect(getActiveMedications(courses, '2026-09-30')).toEqual([]);
    expect(getActiveMedications(courses, '2026-10-01')).toEqual(courses);
    expect(getActiveMedications(courses, '2036-10-01')).toEqual(courses);
  });

  it('TC-235 — giữ thứ tự, trường bổ sung và không sửa dữ liệu đầu vào', () => {
    const first = Object.freeze({
      id: 'b',
      status: 'active' as const,
      startDate: '2026-10-01',
      endDate: null,
    });
    const future = Object.freeze({ ...first, id: 'future', startDate: '2026-11-01' });
    const second = Object.freeze({ ...first, id: 'a', name: 'Canxi' });
    const courses = Object.freeze([first, future, second]);
    const result = getActiveMedications(courses, '2026-10-10');
    expect(result).toEqual([first, second]);
    expect(result[0]).toBe(first);
    expect(result[1]).toBe(second);
    expect(result).not.toBe(courses);
    expect(courses).toEqual([first, future, second]);
  });

  it('TC-236 — danh sách đầu vào rỗng trả về danh sách rỗng', () => {
    expect(getActiveMedications([], '2026-10-10')).toEqual([]);
  });

  it('TC-237 — dừng ngay ngày bắt đầu tạo khoảng rỗng, không xuất hiện ngày nào', () => {
    const courses: MedicationCoursePeriod[] = [
      { status: 'stopped', startDate: '2026-10-01', endDate: '2026-09-30' },
    ];
    expect(getActiveMedications(courses, '2026-09-30')).toEqual([]);
    expect(getActiveMedications(courses, '2026-10-01')).toEqual([]);
  });
});
