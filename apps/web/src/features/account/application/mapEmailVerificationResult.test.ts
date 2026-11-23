import { expect, it } from 'vitest';
import { mapEmailVerificationResult } from './mapEmailVerificationResult';

it('TC-925: kết quả 204 ánh xạ sang trạng thái thành công', () => {
  expect(mapEmailVerificationResult({ ok: true, data: undefined })).toEqual({
    stage: 'success',
    error: null,
  });
});

it('TC-926: mã ERR_VERIFICATION_TOKEN_INVALID ánh xạ sang trạng thái link hỏng', () => {
  expect(
    mapEmailVerificationResult({ ok: false, code: 'ERR_VERIFICATION_TOKEN_INVALID', status: 400 }),
  ).toEqual({
    stage: 'invalid',
    error: null,
  });
});

it('TC-931: mã ERR_EMAIL_TAKEN ánh xạ sang trạng thái email trùng', () => {
  expect(mapEmailVerificationResult({ ok: false, code: 'ERR_EMAIL_TAKEN', status: 409 })).toEqual({
    stage: 'taken',
    error: null,
  });
});

it.each([
  ['ERR_RATE_LIMITED', 429, 'Bạn thao tác quá nhanh, vui lòng thử lại sau.'],
  ['ERR_AUTH_UNAVAILABLE', 503, 'Hệ thống xác thực đang bận hoặc tạm gián đoạn. Vui lòng thử lại sau.'],
  ['NETWORK', undefined, 'Mất kết nối. Kiểm tra mạng rồi thử lại.'],
  ['UNKNOWN', 500, 'Không thể kết nối. Vui lòng thử lại.'],
])('mã %s ánh xạ sang trạng thái lỗi chung dùng accountErrorMessage', (code, status, message) => {
  expect(
    mapEmailVerificationResult({ ok: false, code, ...(status !== undefined ? { status } : {}) }),
  ).toEqual({
    stage: 'error',
    error: message,
  });
});
