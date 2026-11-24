import { expect, it, vi } from 'vitest';
import type { SubmitAccountEmailChange } from './ports';
import { updateAccountEmail } from './updateAccountEmail';

it('kiểm tra email trống, sai định dạng và thiếu mật khẩu hiện tại trước khi gọi API', async () => {
  const submit = vi.fn<SubmitAccountEmailChange>();
  expect(await updateAccountEmail({ email: '  ', currentPassword: 'pw' }, 'csrf', submit)).toEqual({
    status: 'invalid',
    field: 'email',
    message: 'Vui lòng nhập email.',
  });
  expect(await updateAccountEmail({ email: 'khong-hop-le', currentPassword: 'pw' }, 'csrf', submit)).toEqual({
    status: 'invalid',
    field: 'email',
    message: 'Vui lòng nhập email đúng định dạng.',
  });
  expect(await updateAccountEmail({ email: 'lan@example.com', currentPassword: '' }, 'csrf', submit)).toEqual(
    {
      status: 'invalid',
      field: 'currentPassword',
      message: 'Vui lòng nhập mật khẩu hiện tại.',
    },
  );
  expect(submit).not.toHaveBeenCalled();
});

it('TC-932: cắt khoảng trắng email và gửi đúng body cùng CSRF khi hợp lệ', async () => {
  const data = { email: 'lan@example.com', emailVerified: false, pendingEmail: null };
  const submit = vi.fn<SubmitAccountEmailChange>().mockResolvedValue({ ok: true, data });
  const result = await updateAccountEmail(
    { email: '  lan@example.com ', currentPassword: 'matkhau123' },
    'csrf-9',
    submit,
  );
  expect(submit).toHaveBeenCalledExactlyOnceWith(
    { email: 'lan@example.com', currentPassword: 'matkhau123' },
    'csrf-9',
  );
  expect(result).toEqual({ status: 'updated', data });
});

it.each([
  ['ERR_INVALID_CREDENTIALS', 'error', 'Tên đăng nhập hoặc mật khẩu chưa đúng.'],
  ['ERR_RATE_LIMITED', 'error', 'Bạn thao tác quá nhanh, vui lòng thử lại sau.'],
  ['ERR_VALIDATION', 'invalid', 'Dữ liệu gửi lên không đúng định dạng quy định.'],
] as const)('TC-927: ánh xạ mã lỗi %s qua accountErrorMessage', async (code, status, message) => {
  const submit = vi.fn<SubmitAccountEmailChange>().mockResolvedValue({ ok: false, code });
  const result = await updateAccountEmail(
    { email: 'lan@example.com', currentPassword: 'sai' },
    'csrf-9',
    submit,
  );
  expect(result).toMatchObject({ status, message });
});
