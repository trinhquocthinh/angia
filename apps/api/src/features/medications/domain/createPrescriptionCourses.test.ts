import { describe, expect, it } from 'vitest';
import type { Prescription } from '@src/features/prescriptions/domain/Prescription.js';
import { createPrescriptionCourses } from './createPrescriptionCourses.js';

const prescription = (): Prescription => ({
  id: 'p-1',
  healthProfileId: 'profile-1',
  sourceDocumentId: 'doc-1',
  issuedDate: '2026-10-01',
  facility: null,
  diagnosis: null,
  manualWithoutSource: false,
  createdAt: new Date('2026-10-10T00:00:00Z'),
  items: [
    {
      id: 'item-1',
      name: 'Đường  Glucophage',
      strength: '500mg',
      quantityPerDose: 0.5,
      doseUnit: null,
      slots: ['morning', 'evening'],
      durationDays: 30,
      longTerm: false,
      note: 'Sau ăn',
      totalQuantity: 30,
    },
  ],
});

// Sai ngày gốc, cộng thiếu -1, suy liều hoặc làm thay đổi đơn đều phải bị phát hiện.
describe('Tạo đợt từ các dòng đơn đã hợp lệ (SPEC-014)', () => {
  it('TC-043: chép dữ liệu, chuẩn hóa tên, tính ngày cuối từ ngày kê', () => {
    const input = prescription();
    const before = structuredClone(input);
    const courses = createPrescriptionCourses(input);
    expect(courses).toEqual([
      {
        healthProfileId: 'profile-1',
        prescriptionItemId: 'item-1',
        source: 'prescription',
        name: 'Đường  Glucophage',
        nameNormalized: 'duong glucophage',
        quantityPerDose: 0.5,
        doseUnit: null,
        slots: ['morning', 'evening'],
        startDate: '2026-10-01',
        endDate: '2026-10-30',
        status: 'active',
      },
    ]);
    expect(input).toEqual(before);
    expect(courses[0]!.slots).not.toBe(input.items[0]!.slots);
  });

  it('TC-045: dài hạn luôn để ngày kết thúc null', () => {
    const input = prescription();
    input.items[0]!.longTerm = true;
    input.items[0]!.durationDays = null;
    expect(createPrescriptionCourses(input)[0]).toMatchObject({
      status: 'active',
      startDate: '2026-10-01',
      endDate: null,
    });
  });

  it('TC-043: mỗi dòng tạo một đợt độc lập, kể cả tên giống nhau trong cùng đơn', () => {
    const input = prescription();
    input.items.push({ ...input.items[0]!, id: 'item-2', durationDays: 1 });
    const courses = createPrescriptionCourses(input);
    expect(courses.map((course) => [course.prescriptionItemId, course.endDate])).toEqual([
      ['item-1', '2026-10-30'],
      ['item-2', '2026-10-01'],
    ]);
  });
});
