import { describe, expect, it } from 'vitest';
import { measurementFingerprint, prescriptionFingerprint } from './contentFingerprint.js';
import { isDuplicate, type DocumentContent } from './isDuplicate.js';

const motherPrescription: DocumentContent = {
  healthProfileId: 'me',
  type: 'prescription',
  date: '2026-09-05',
  time: null,
  fingerprint: prescriptionFingerprint([
    { name: 'Amlodipin', strength: '5mg' },
    { name: 'Metformin', strength: '500mg' },
  ]),
};
const incoming = (overrides: Partial<DocumentContent> = {}): DocumentContent => ({
  ...motherPrescription,
  fingerprint: prescriptionFingerprint([
    { name: 'amlodipin', strength: '5mg' },
    { name: 'METFORMIN', strength: '500mg' },
  ]),
  ...overrides,
});
const reading = (time: string | null): DocumentContent => ({
  healthProfileId: 'me',
  type: 'device_reading',
  date: '2026-10-06',
  time,
  fingerprint: measurementFingerprint({
    kind: 'blood_pressure',
    systolic: 130,
    diastolic: 85,
    pulse: null,
    glucoseValue: null,
    glucoseUnit: null,
  }),
});

describe('isDuplicate — phát hiện chứng từ trùng lặp (SPEC-012, BR-017)', () => {
  it('TC-038: cùng hồ sơ "Mẹ", cùng ngày 05/09, tên thuốc khác hoa/thường → trùng', () => {
    expect(isDuplicate(incoming(), motherPrescription)).toBe(true);
  });

  it('TC-040: đơn của "Ba" giống hệt đơn của "Mẹ" → không trùng (khác hồ sơ)', () => {
    expect(isDuplicate(incoming({ healthProfileId: 'father' }), motherPrescription)).toBe(false);
  });

  it('khác ngày, khác loại hoặc thêm một thuốc → không trùng', () => {
    expect(isDuplicate(incoming({ date: '2026-09-06' }), motherPrescription)).toBe(false);
    expect(isDuplicate(incoming({ type: 'lab_result' }), motherPrescription)).toBe(false);
    const extra = prescriptionFingerprint([
      { name: 'Amlodipin', strength: '5mg' },
      { name: 'Metformin', strength: '500mg' },
      { name: 'Losartan', strength: '50mg' },
    ]);
    expect(isDuplicate(incoming({ fingerprint: extra }), motherPrescription)).toBe(false);
  });

  it('số đo: giờ đo chỉ so khi cả hai bản đều có giờ', () => {
    expect(isDuplicate(reading('07:30'), reading('07:30'))).toBe(true);
    expect(isDuplicate(reading('07:30'), reading('19:30'))).toBe(false);
    expect(isDuplicate(reading(null), reading('07:30'))).toBe(true);
    expect(isDuplicate(reading('07:30'), reading(null))).toBe(true);
  });
});
