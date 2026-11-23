import { expect, it } from 'vitest';
import { formatTempPasswordExpiry } from './formatTempPasswordExpiry';

it('TC-756: định dạng hạn mật khẩu tạm theo múi giờ Asia/Ho_Chi_Minh và vi-VN', () => {
  expect(formatTempPasswordExpiry('2026-11-24T04:30:00.000Z')).toBe(
    'Chỉ hiện một lần. Hết hạn lúc 11:30 ngày 24/11/2026.',
  );
  // Qua nửa đêm theo giờ Việt Nam (17:05 UTC = 00:05 hôm sau).
  expect(formatTempPasswordExpiry('2026-11-24T17:05:00.000Z')).toBe(
    'Chỉ hiện một lần. Hết hạn lúc 00:05 ngày 25/11/2026.',
  );
  expect(formatTempPasswordExpiry('2026-01-05T02:09:00.000Z')).toBe(
    'Chỉ hiện một lần. Hết hạn lúc 09:09 ngày 05/01/2026.',
  );
});

it('SPEC-062: chuỗi expiresAt không hợp lệ rơi về câu dự phòng an toàn', () => {
  expect(formatTempPasswordExpiry('invalid-date')).toBe('Chỉ hiện một lần. Hết hạn sau 24 giờ.');
});
