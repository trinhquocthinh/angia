import { describe, expect, it } from 'vitest';
import { medicationSourceLabel } from './medicationSourceLabel';
describe('Nhãn nguồn gốc đợt thuốc (Design §6, E4-S4-T1)', () => {
  it('TC-239: đơn thuốc ghi ngày kê, thuốc bổ ghi Tự khai', () => {
    expect(medicationSourceLabel({ source: 'prescription', prescriptionIssuedDate: '2026-10-01' })).toBe(
      'Đơn 01/10/2026',
    );
    expect(medicationSourceLabel({ source: 'prescription', prescriptionIssuedDate: null })).toBe('Theo đơn');
    expect(medicationSourceLabel({ source: 'self_reported', prescriptionIssuedDate: null })).toBe('Tự khai');
  });
});
