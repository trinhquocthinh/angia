import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { useLoginForm } from './useLoginForm';
import type { SubmitPasswordLogin } from './ports';
function loginModel(submitLogin: SubmitPasswordLogin, success = vi.fn(async () => undefined)) {
  let model!: ReturnType<typeof useLoginForm>;
  function Probe() {
    model = useLoginForm(submitLogin, success, false);
    return null;
  }
  renderToStaticMarkup(<Probe />);
  model.form.setValue('username', 'me.lan');
  model.form.setValue('password', 'matkhau123');
  return { model, success };
}
it('TC-744: gửi đúng hai trường rồi hoàn tất phiên', async () => {
  const submit = vi.fn<SubmitPasswordLogin>().mockResolvedValue({
    ok: true,
    data: {
      session: { csrfToken: 'csrf', expiresAt: '2026-12-01T00:00:00Z', passwordChangeRequired: false },
    },
  });
  const { model, success } = loginModel(submit);
  await model.submit();
  expect(submit).toHaveBeenCalledWith({ username: 'me.lan', password: 'matkhau123' });
  expect(success).toHaveBeenCalledOnce();
});
it.each([
  'ERR_INVALID_CREDENTIALS',
  'ERR_ACCOUNT_LOCKED',
  'ERR_RATE_LIMITED',
  'ERR_AUTH_UNAVAILABLE',
  'NETWORK',
])('lỗi %s không hoàn tất phiên', async (code) => {
  const { model, success } = loginModel(async () => ({ ok: false, code }));
  await model.submit();
  expect(success).not.toHaveBeenCalled();
});
it('giữ trạng thái gửi trong lúc chờ phản hồi rồi mở lại form khi thất bại', async () => {
  let release!: (value: Awaited<ReturnType<SubmitPasswordLogin>>) => void;
  const { model, success } = loginModel(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  const busy: boolean[] = [];
  const observed = { submitCount: true, isSubmitting: true };
  const unsubscribe = model.form.subscribe({
    formState: observed,
    callback: (state) => {
      busy.push(Boolean(state.isSubmitting));
    },
  });
  const pending = model.submit();
  await vi.waitFor(() => expect(release).toBeTypeOf('function'));
  expect(busy.at(-1)).toBe(true);
  release({ ok: false, code: 'ERR_INVALID_CREDENTIALS' });
  await pending;
  expect(busy.at(-1)).toBe(false);
  expect(success).not.toHaveBeenCalled();
  unsubscribe();
});
