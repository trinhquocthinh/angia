import { expect, it, vi } from 'vitest';
import { requestPasswordReset } from './requestPasswordReset';
import type { SubmitPasswordResetRequest } from './ports';

it.each([
  ['', 'Vui lòng nhập email.'],
  ['   ', 'Vui lòng nhập email.'],
  ['me.lan', 'Vui lòng nhập email đúng định dạng.'],
  ['lan@', 'Vui lòng nhập email đúng định dạng.'],
])('không gửi API khi email «%s» không hợp lệ', async (email, message) => {
  const submit = vi.fn<SubmitPasswordResetRequest>();
  expect(await requestPasswordReset(email, submit)).toEqual({ status: 'invalid', message });
  expect(submit).not.toHaveBeenCalled();
});
it('TC-762: gửi đúng email, chuyển sang đã gửi mà không trả lại email', async () => {
  const submit = vi
    .fn<SubmitPasswordResetRequest>()
    .mockResolvedValue({ ok: true, data: { received: true } });
  expect(await requestPasswordReset('lan@example.com', submit)).toEqual({ status: 'sent' });
  expect(submit).toHaveBeenCalledExactlyOnceWith({ email: 'lan@example.com' });
});
it('gửi lại cùng email vẫn nhận trạng thái đã gửi', async () => {
  const submit = vi
    .fn<SubmitPasswordResetRequest>()
    .mockResolvedValue({ ok: true, data: { received: true } });
  await requestPasswordReset('lan@example.com', submit);
  expect(await requestPasswordReset('lan@example.com', submit)).toEqual({ status: 'sent' });
  expect(submit.mock.calls).toEqual([[{ email: 'lan@example.com' }], [{ email: 'lan@example.com' }]]);
});
it.each([
  ['ERR_RATE_LIMITED', 'error', 'Bạn thao tác quá nhanh, vui lòng thử lại sau.'],
  ['ERR_VALIDATION', 'invalid', 'Dữ liệu gửi lên không đúng định dạng quy định.'],
  ['NETWORK', 'error', 'Mất kết nối. Kiểm tra mạng rồi thử lại.'],
  ['UNKNOWN', 'error', 'Không thể kết nối. Vui lòng thử lại.'],
])('lỗi %s không chuyển sang đã gửi và dùng catalog', async (code, status, message) => {
  expect(await requestPasswordReset('lan@example.com', async () => ({ ok: false, code }))).toEqual({
    status,
    message,
  });
});
