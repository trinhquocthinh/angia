import { describe, expect, it } from 'vitest';
import { parseModelJson } from './parseModelJson.js';

const reading = {
  type: 'device_reading',
  measuredAt: null,
  measuredTime: null,
  kind: 'glucose',
  systolic: null,
  diastolic: null,
  pulse: null,
  glucoseValue: 6.4,
  glucoseUnit: 'mmol/L',
};

describe('parseModelJson', () => {
  it('đọc JSON thuần khớp schema', () => {
    const result = parseModelJson(JSON.stringify(reading));
    expect(result).toEqual({ ok: true, payload: reading });
  });

  it('bóc khối ```json do model bọc quanh kết quả', () => {
    const result = parseModelJson('Kết quả:\n```json\n' + JSON.stringify(reading) + '\n```');
    expect(result.ok).toBe(true);
  });

  it('báo lỗi khi phản hồi không phải JSON', () => {
    expect(parseModelJson('Tôi không đọc được ảnh')).toEqual({ ok: false, reason: 'invalid_json' });
  });

  it('báo lỗi khi JSON sai schema SDD §2.1', () => {
    const result = parseModelJson(JSON.stringify({ ...reading, kind: 'spo2' }));
    expect(result).toEqual({ ok: false, reason: 'schema_mismatch' });
  });
});
