import type { MedicationCourse } from '@angia/contracts';
import { describe, expect, it } from 'vitest';
import type { AdherencePeriod } from './ports';
import { matchingStoppableCourses } from './matchingStoppableCourses';

const course = (overrides: Partial<MedicationCourse>): MedicationCourse => ({
  id: 'c1',
  healthProfileId: 'p',
  prescriptionItemId: null,
  source: 'self_reported',
  name: 'Dầu cá',
  strength: null,
  quantityPerDose: 1,
  doseUnit: 'viên',
  slots: ['morning'],
  startDate: '2026-10-01',
  endDate: null,
  status: 'active',
  ...overrides,
});
const period = (overrides: Partial<AdherencePeriod> = {}): AdherencePeriod => ({
  id: 'a',
  healthProfileId: 'p',
  medicationName: 'dau  CA',
  status: 'stopped',
  fromDate: '2026-10-16',
  toDate: null,
  ...overrides,
});

describe('Gợi ý dừng đợt thuốc sau khi ghi "Ngưng" thực tế (SPEC-022, owner chốt 2026-10-16)', () => {
  it('chỉ đợt còn dừng được, cùng tên chuẩn hóa và bắt đầu không sau mốc ngưng', () => {
    const courses = [
      course({ id: 'match' }),
      course({ id: 'other', name: 'Amlodipin' }),
      course({ id: 'later', startDate: '2026-10-17' }),
    ];
    expect(matchingStoppableCourses(courses, period()).map((c) => c.id)).toEqual(['match']);
  });

  it('ghi "Đang dùng" thì không gợi ý dừng', () => {
    expect(matchingStoppableCourses([course({})], period({ status: 'taking' }))).toEqual([]);
  });
});
