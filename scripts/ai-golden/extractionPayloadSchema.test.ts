import { describe, expect, it } from 'vitest';
import { extractionPayloadSchema } from './extractionPayloadSchema.js';

const prescription = {
  type: 'prescription',
  issuedDate: '2026-10-01',
  facility: 'Bệnh viện Đa khoa Tỉnh',
  items: [
    {
      name: 'Amlodipin',
      strength: '5mg',
      quantityPerDose: 1,
      doseUnit: 'viên',
      slots: ['morning'],
      durationDays: 30,
      longTerm: false,
      note: null,
    },
  ],
};

describe('extractionPayloadSchema (SDD §2.1)', () => {
  it('chấp nhận đơn thuốc đúng mẫu SDD §2.1a', () => {
    expect(extractionPayloadSchema.safeParse(prescription).success).toBe(true);
  });

  it('chấp nhận phiếu xét nghiệm đúng mẫu SDD §2.1b', () => {
    const lab = {
      type: 'lab_result',
      resultDate: '2026-10-01',
      facility: null,
      items: [{ testName: 'HbA1c', value: '7.2', unit: '%', referenceRange: '4.0 - 6.0' }],
    };
    expect(extractionPayloadSchema.safeParse(lab).success).toBe(true);
  });

  it('chấp nhận màn hình máy đo đúng mẫu SDD §2.1c', () => {
    const reading = {
      type: 'device_reading',
      measuredAt: '2026-10-05',
      measuredTime: '07:10',
      kind: 'blood_pressure',
      systolic: 145,
      diastolic: 90,
      pulse: 78,
      glucoseValue: null,
      glucoseUnit: null,
    };
    expect(extractionPayloadSchema.safeParse(reading).success).toBe(true);
  });

  it('từ chối buổi dùng ngoài tập morning/noon/afternoon/evening', () => {
    const bad = { ...prescription, items: [{ ...prescription.items[0], slots: ['sáng'] }] };
    expect(extractionPayloadSchema.safeParse(bad).success).toBe(false);
  });

  it('từ chối khi thiếu trường thay vì gán null (BR-016)', () => {
    const withoutFacility: Record<string, unknown> = { ...prescription };
    delete withoutFacility.facility;
    expect(extractionPayloadSchema.safeParse(withoutFacility).success).toBe(false);
  });

  it('từ chối loại chứng từ không thuộc 3 loại chuẩn', () => {
    expect(extractionPayloadSchema.safeParse({ type: 'invoice' }).success).toBe(false);
  });
});
