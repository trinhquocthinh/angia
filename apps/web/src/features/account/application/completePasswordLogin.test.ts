import { afterEach, expect, it, vi } from 'vitest';
import { completePasswordLogin } from './completePasswordLogin';
afterEach(() => vi.unstubAllGlobals());
it('TC-748: lưu CSRF phiên hạn chế và chuyển thẳng tới đổi mật khẩu', async () => {
  const setItem = vi.fn();
  vi.stubGlobal('sessionStorage', { setItem });
  const invalidate = vi.fn(async () => undefined);
  const navigate = vi.fn(async () => undefined);
  await completePasswordLogin(
    { csrfToken: 'restricted', passwordChangeRequired: true, passwordResetBy: 'Thịnh' },
    invalidate,
    navigate,
  );
  expect(setItem).toHaveBeenCalledWith('angia.restrictedCsrf', 'restricted');
  expect(setItem).toHaveBeenCalledWith('angia.passwordResetBy', 'Thịnh');
  expect(navigate).toHaveBeenCalledWith({ to: '/account/change-password', replace: true });
  expect(invalidate).not.toHaveBeenCalled();
});
it('TC-749: đăng nhập thường xoá CSRF cũ và làm mới phiên trước khi về trang chủ', async () => {
  const removeItem = vi.fn();
  vi.stubGlobal('sessionStorage', { removeItem });
  const invalidate = vi.fn(async () => undefined);
  const navigate = vi.fn(async () => undefined);
  await completePasswordLogin(
    { csrfToken: 'normal', passwordChangeRequired: false, passwordResetBy: null },
    invalidate,
    navigate,
  );
  expect(removeItem).toHaveBeenCalledWith('angia.restrictedCsrf');
  expect(removeItem).toHaveBeenCalledWith('angia.passwordResetBy');
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['current-session'] });
  expect(navigate).toHaveBeenCalledWith({ to: '/', replace: true });
});
it('TC-748: trình duyệt chặn storage vẫn điều hướng để hiển thị đăng nhập lại', async () => {
  vi.stubGlobal('sessionStorage', {
    setItem: () => {
      throw new Error('blocked');
    },
  });
  const navigate = vi.fn(async () => undefined);
  await completePasswordLogin(
    { csrfToken: 'csrf', passwordChangeRequired: true, passwordResetBy: 'Thịnh' },
    vi.fn(),
    navigate,
  );
  expect(navigate).toHaveBeenCalledWith({ to: '/account/change-password', replace: true });
});

it('TC-748: phiên hạn chế không có tên xoá tên người đặt lại của phiên cũ', async () => {
  const removeItem = vi.fn();
  vi.stubGlobal('sessionStorage', { setItem: vi.fn(), removeItem });
  await completePasswordLogin(
    { csrfToken: 'restricted', passwordChangeRequired: true, passwordResetBy: null },
    vi.fn(),
    vi.fn(),
  );
  expect(removeItem).toHaveBeenCalledWith('angia.passwordResetBy');
});
