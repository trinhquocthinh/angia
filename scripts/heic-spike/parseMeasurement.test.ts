import { describe, expect, it } from 'vitest';
import { parseMeasurement } from './parseMeasurement.js';

describe('parseMeasurement', () => {
  it('đọc dòng JSON cuối cùng của tiến trình con khi chuyển đổi thành công', () => {
    const stdout = [
      'cảnh báo từ thư viện',
      JSON.stringify({
        ok: true,
        durationMs: 4200,
        maxRssMb: 310,
        width: 4032,
        height: 3024,
        outputBytes: 900_000,
      }),
      '',
    ].join('\n');

    expect(parseMeasurement(stdout)).toEqual({
      ok: true,
      durationMs: 4200,
      maxRssMb: 310,
      width: 4032,
      height: 3024,
      outputBytes: 900_000,
    });
  });

  it('giữ thông điệp lỗi khi pipeline thất bại', () => {
    const stdout = JSON.stringify({ ok: false, durationMs: 12, maxRssMb: 80, error: 'unsupported codec' });

    expect(parseMeasurement(stdout)).toEqual({
      ok: false,
      durationMs: 12,
      maxRssMb: 80,
      error: 'unsupported codec',
    });
  });

  it('báo lỗi khi tiến trình con không in kết quả hợp lệ (ví dụ bị OOM giết)', () => {
    expect(() => parseMeasurement('')).toThrow(/không có kết quả/);
    expect(() => parseMeasurement('{"ok":true}')).toThrow(/sai cấu trúc/);
  });
});
