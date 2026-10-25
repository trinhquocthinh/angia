import { describe, expect, it } from 'vitest';
import {
  labResultFingerprint,
  measurementFingerprint,
  prescriptionFingerprint,
} from './contentFingerprint.js';

const bp = { systolic: 130, diastolic: 85, pulse: 72, glucoseValue: null, glucoseUnit: null };

describe('Dấu vân nội dung chứng từ (SPEC-012)', () => {
  it('đơn thuốc: tên chuẩn hóa + hàm lượng bỏ khoảng trắng, không kể thứ tự và dòng lặp', () => {
    const saved = prescriptionFingerprint([
      { name: 'Amlodipin', strength: '5mg' },
      { name: 'Metformin', strength: '500 mg' },
    ]);
    const incoming = prescriptionFingerprint([
      { name: 'METFORMIN', strength: '500MG' },
      { name: '  amlodipin ', strength: '5 mg' },
      { name: 'Amlodipin', strength: '5mg' },
    ]);
    expect(incoming).toEqual(saved);
  });

  it('đơn thuốc: khác hàm lượng hoặc thiếu hàm lượng là khác dấu vân', () => {
    const saved = prescriptionFingerprint([{ name: 'Amlodipin', strength: '5mg' }]);
    expect(prescriptionFingerprint([{ name: 'Amlodipin', strength: '10mg' }])).not.toEqual(saved);
    expect(prescriptionFingerprint([{ name: 'Amlodipin', strength: null }])).not.toEqual(saved);
  });

  it('xét nghiệm: tên chỉ số chuẩn hóa + giá trị bỏ khoảng trắng', () => {
    expect(labResultFingerprint([{ testName: 'Đường huyết', value: '6,8 ' }])).toEqual(
      labResultFingerprint([{ testName: 'duong HUYET', value: ' 6,8' }]),
    );
    expect(labResultFingerprint([{ testName: 'HbA1c', value: '7.2' }])).not.toEqual(
      labResultFingerprint([{ testName: 'HbA1c', value: '7.3' }]),
    );
  });

  it('số đo: cùng loại và cùng mọi giá trị mới cùng dấu vân', () => {
    const reading = measurementFingerprint({ kind: 'blood_pressure', ...bp });
    expect(measurementFingerprint({ kind: 'blood_pressure', ...bp })).toEqual(reading);
    expect(measurementFingerprint({ kind: 'blood_pressure', ...bp, pulse: null })).not.toEqual(reading);
    const glucose = { ...bp, systolic: null, diastolic: null, pulse: null, glucoseValue: 6.8 };
    expect(measurementFingerprint({ kind: 'glucose', ...glucose, glucoseUnit: 'mmol/L' })).not.toEqual(
      measurementFingerprint({ kind: 'glucose', ...glucose, glucoseUnit: 'mg/dL' }),
    );
  });
});
