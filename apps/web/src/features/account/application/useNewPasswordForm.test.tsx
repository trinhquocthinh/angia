import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { useNewPasswordForm } from './useNewPasswordForm';
import type { SubmitAccountAction } from './ports';
vi.stubGlobal('requestAnimationFrame', (callback: () => void) => {
  callback();
  return 0;
});
afterEach(() => vi.clearAllMocks());
function model(action: SubmitAccountAction) {
  let form!: ReturnType<typeof useNewPasswordForm>;
  const success = vi.fn(async () => undefined);
  function Probe() {
    form = useNewPasswordForm(action, '/api/me/password', 'csrf', success);
    return null;
  }
  renderToStaticMarkup(<Probe />);
  return { form, success };
}
it('TC-749: dữ liệu hợp lệ gửi newPassword không có currentPassword', async () => {
  const action = vi.fn<SubmitAccountAction>().mockResolvedValue({ ok: true, data: undefined });
  const { form, success } = model(action);
  form.form.setValue('password', 'password1');
  form.form.setValue('confirmation', 'password1');
  await form.submit();
  expect(action).toHaveBeenCalledWith('/api/me/password', { newPassword: 'password1' }, 'csrf');
  expect(success).toHaveBeenCalledOnce();
});
it('TC-749: lỗi kiểm tra không gửi API', async () => {
  const action = vi.fn<SubmitAccountAction>();
  const { form } = model(action);
  form.form.setValue('password', 'short');
  await form.submit();
  expect(action).not.toHaveBeenCalled();
  expect(form.form.getFieldState('password').error?.message).toBe('Mật khẩu cần ít nhất 8 ký tự.');
});
it('TC-901: lỗi xác minh được chuyển cho xử lý enrollment', async () => {
  let form!: ReturnType<typeof useNewPasswordForm>;
  const failure = { ok: false as const, code: 'ERR_FORBIDDEN', status: 403 };
  const onFailure = vi.fn(() => true);
  const success = vi.fn(async () => undefined);
  function Probe() {
    form = useNewPasswordForm(async () => failure, '/api/me/local-credential', 'csrf', success, onFailure);
    return null;
  }
  renderToStaticMarkup(<Probe />);
  form.form.setValue('password', 'password1');
  form.form.setValue('confirmation', 'password1');
  await form.submit();
  expect(onFailure).toHaveBeenCalledWith(failure);
  expect(success).not.toHaveBeenCalled();
});
it('TC-749: lỗi validation máy chủ liên kết ô mật khẩu mới', async () => {
  const { form, success } = model(async () => ({ ok: false, code: 'ERR_VALIDATION', field: 'newPassword' }));
  form.form.setValue('password', 'password1');
  form.form.setValue('confirmation', 'password1');
  await form.submit();
  expect(form.form.getFieldState('password').error?.message).toBe(
    'Dữ liệu gửi lên không đúng định dạng quy định.',
  );
  expect(success).not.toHaveBeenCalled();
});
