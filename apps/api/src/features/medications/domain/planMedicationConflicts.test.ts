import { describe, expect, it } from 'vitest';
import type { ConflictCourse, ConflictItem } from './MedicationConflict.js';
import { planMedicationConflicts } from './planMedicationConflicts.js';

const old = (changes: Partial<ConflictCourse> = {}): ConflictCourse =>
  ({
    id: 'old-1',
    healthProfileId: 'me',
    prescriptionItemId: null,
    source: 'self_reported',
    name: 'Đường Glucophage',
    nameNormalized: 'duong glucophage',
    quantityPerDose: 1,
    doseUnit: null,
    slots: ['morning'],
    status: 'active',
    startDate: '2026-09-01',
    endDate: null,
    ...changes,
  }) as ConflictCourse;
const item = (changes: Partial<ConflictItem> = {}): ConflictItem => ({
  name: '  ĐƯỜNG   glucophage ',
  ...changes,
});
const confirmed = { resolution: 'replace' as const, expectedConflictCourseIds: ['old-1'] };

describe('Kế hoạch giải quyết xung đột thuốc thuần (SPEC-015)', () => {
  it('TC-046: chuẩn hóa dấu tiếng Việt và khoảng trắng, không dùng hàm lượng để bỏ qua xung đột', () => {
    expect(planMedicationConflicts([old()], [item()], '2026-10-01')).toMatchObject({
      ok: false,
      conflicts: [{ nameNormalized: 'duong glucophage', itemIndexes: [0] }],
    });
  });
  it('TC-047: tính ngày trước ở biên tháng/năm, không đổi đầu vào', () => {
    const courses = Object.freeze([Object.freeze(old())]);
    const items = Object.freeze([Object.freeze(item(confirmed))]);
    expect(planMedicationConflicts(courses, items, '2027-01-01')).toEqual({
      ok: true,
      replaceCourseIds: ['old-1'],
      replacementEndDate: '2026-12-31',
    });
    expect(courses[0]!.status).toBe('active');
    expect(courses[0]!.endDate).toBeNull();
  });
  it('TC-048: song song không tạo lệnh cập nhật đợt cũ', () => {
    expect(
      planMedicationConflicts([old()], [item({ ...confirmed, resolution: 'parallel' })], '2026-10-01'),
    ).toEqual({
      ok: true,
      replaceCourseIds: [],
      replacementEndDate: '2026-09-30',
    });
  });
  it('giữ từng dòng cùng tên, yêu cầu cùng lựa chọn và chỉ thay đợt cũ một lần', () => {
    expect(planMedicationConflicts([old()], [item(confirmed), item(confirmed)], '2026-10-01')).toMatchObject({
      ok: true,
      replaceCourseIds: ['old-1'],
    });
    expect(
      planMedicationConflicts(
        [old()],
        [item(confirmed), item({ ...confirmed, resolution: 'parallel' })],
        '2026-10-01',
      ),
    ).toMatchObject({
      ok: false,
      conflicts: [{ itemIndexes: [0, 1] }],
    });
  });
  it('tính cả ngày cuối, loại đợt tương lai/hết hạn và trạng thái kết thúc khỏi thao tác thay thế', () => {
    expect(planMedicationConflicts([old({ endDate: '2026-10-01' })], [item()], '2026-10-01').ok).toBe(false);
    const excluded = [
      old({ startDate: '2026-10-02' }),
      old({ endDate: '2026-09-30' }),
      old({ status: 'replaced', endDate: '2026-10-10' }),
      old({ status: 'stopped', endDate: '2026-10-10' }),
      old({ status: 'ended', endDate: '2026-10-10' }),
    ];
    expect(planMedicationConflicts(excluded, [item()], '2026-10-01')).toMatchObject({
      ok: true,
      replaceCourseIds: [],
    });
  });
  it('ID sai/lặp/thiếu hoặc danh sách đã đổi đều phải xác nhận lại', () => {
    for (const ids of [undefined, [], ['other'], ['old-1', 'old-1']])
      expect(
        planMedicationConflicts(
          [old()],
          [item({ resolution: 'replace', expectedConflictCourseIds: ids })],
          '2026-10-01',
        ).ok,
      ).toBe(false);
  });
  it('TC-047: thay cùng ngày hợp lệ và trừ ngày qua tháng nhuận', () => {
    expect(
      planMedicationConflicts([old({ startDate: '2028-03-01' })], [item(confirmed)], '2028-03-01'),
    ).toEqual({
      ok: true,
      replaceCourseIds: ['old-1'],
      replacementEndDate: '2028-02-29',
    });
  });
});
