import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import type { SubmitPasswordResetRequest } from './ports';
import { useForgotPasswordForm } from './useForgotPasswordForm';

vi.stubGlobal('requestAnimationFrame', (callback: () => void) => {
  callback();
  return 0;
});
afterEach(() => vi.clearAllMocks());
function model(submit: SubmitPasswordResetRequest) {
  let result!: ReturnType<typeof useForgotPasswordForm>;
  function Probe() {
    result = useForgotPasswordForm(submit);
    return <input {...result.form.register('email')} />;
  }
  renderToStaticMarkup(<Probe />);
  return result;
}
it('email trống hoặc tên đăng nhập được gắn lỗi ô, không gửi API', async () => {
  const submit = vi.fn<SubmitPasswordResetRequest>();
  const state = model(submit);
  await state.submit();
  expect(state.form.getFieldState('email').error?.message).toBe('Vui lòng nhập email.');
  state.form.setValue('email', 'me.lan');
  await state.submit();
  expect(state.form.getFieldState('email').error?.message).toBe('Vui lòng nhập email đúng định dạng.');
  expect(submit).not.toHaveBeenCalled();
});
it('lỗi 422 của máy chủ gắn vào đúng ô email', async () => {
  const state = model(async () => ({ ok: false, code: 'ERR_VALIDATION' }));
  state.form.setValue('email', 'lan@example.com');
  await state.submit();
  expect(state.form.getFieldState('email').error?.message).toBe(
    'Dữ liệu gửi lên không đúng định dạng quy định.',
  );
});
it('giữ trạng thái chờ khi gửi và mở lại khi nhận phản hồi 202', async () => {
  let release!: (value: Awaited<ReturnType<SubmitPasswordResetRequest>>) => void;
  const submit = vi.fn<SubmitPasswordResetRequest>(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  const state = model(submit);
  state.form.setValue('email', 'lan@example.com');
  const busy: boolean[] = [];
  const observed = { submitCount: true, isSubmitting: true };
  const unsubscribe = state.form.subscribe({
    formState: observed,
    callback: (value) => {
      busy.push(Boolean(value.isSubmitting));
    },
  });
  const pending = state.submit();
  await vi.waitFor(() => expect(submit).toHaveBeenCalledExactlyOnceWith({ email: 'lan@example.com' }));
  expect(busy.at(-1)).toBe(true);
  release({ ok: true, data: { received: true } });
  await pending;
  expect(busy.at(-1)).toBe(false);
  unsubscribe();
});
