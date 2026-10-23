import { describe, expect, it } from 'vitest';
import { reminderMedicationLine } from './reminderMedicationLine';

describe('Dòng thuốc trong lời nhắc', () => {
  it('đủ thông tin: tên · hàm lượng · số lượng đơn vị', () => {
    expect(
      reminderMedicationLine({ name: 'Amlodipin', strength: '5 mg', quantityPerDose: '1', doseUnit: 'viên' }),
    ).toBe('Amlodipin · 5 mg · 1 viên');
  });
  it('bỏ phần không ghi, không hiện "null"', () => {
    expect(
      reminderMedicationLine({ name: 'Kem bôi', strength: null, quantityPerDose: null, doseUnit: null }),
    ).toBe('Kem bôi');
    expect(
      reminderMedicationLine({ name: 'Siro', strength: null, quantityPerDose: '5', doseUnit: null }),
    ).toBe('Siro · 5');
  });
});
