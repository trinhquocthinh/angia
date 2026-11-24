import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import type { SubmitAccountEmailChange, SubmitEmailVerificationRequest } from './ports';
import { useAccountEmailForm } from './useAccountEmailForm';

vi.stubGlobal('requestAnimationFrame', (callback: () => void) => {
  callback();
  return 0;
});
afterEach(() => vi.clearAllMocks());

function mount(
  submitEmail: SubmitAccountEmailChange,
  submitVerify: SubmitEmailVerificationRequest,
  onRefreshSession = vi.fn(async () => {}),
) {
  let result!: ReturnType<typeof useAccountEmailForm>;
  function Probe() {
    result = useAccountEmailForm({
      csrfToken: 'csrf-tok',
      submitEmail,
      submitVerify,
      onRefreshSession,
    });
    return (
      <form>
        <input {...result.form.register('email')} />
        <input {...result.form.register('currentPassword')} />
      </form>
    );
  }
  renderToStaticMarkup(<Probe />);
  return { result, onRefreshSession };
}

it('TC-932: lưu email chỉ gọi PATCH và làm mới phiên, không tự gửi liên kết xác minh', async () => {
  const submitEmail = vi.fn<SubmitAccountEmailChange>().mockResolvedValue({
    ok: true,
    data: { email: 'lan@example.com', emailVerified: false, pendingEmail: null },
  });
  const submitVerify = vi.fn<SubmitEmailVerificationRequest>();
  const { result, onRefreshSession } = mount(submitEmail, submitVerify);
  result.form.setValue('email', 'lan@example.com');
  result.form.setValue('currentPassword', 'matkhau123');
  await result.submit();
  expect(submitEmail).toHaveBeenCalledExactlyOnceWith(
    { email: 'lan@example.com', currentPassword: 'matkhau123' },
    'csrf-tok',
  );
  expect(submitVerify).not.toHaveBeenCalled();
  expect(onRefreshSession).toHaveBeenCalledTimes(1);
});

it('TC-925: bấm xác minh nhận 204 thì làm mới phiên', async () => {
  const submitEmail = vi.fn<SubmitAccountEmailChange>();
  const submitVerify = vi
    .fn<SubmitEmailVerificationRequest>()
    .mockResolvedValue({ ok: true, data: { alreadyVerified: true } });
  const { result, onRefreshSession } = mount(submitEmail, submitVerify);
  await result.requestVerification();
  expect(submitVerify).toHaveBeenCalledExactlyOnceWith('csrf-tok');
  expect(onRefreshSession).toHaveBeenCalledTimes(1);
});

it('TC-927: mật khẩu hiện tại sai không làm mới phiên và giữ lỗi hợp lệ', async () => {
  const submitEmail = vi
    .fn<SubmitAccountEmailChange>()
    .mockResolvedValue({ ok: false, code: 'ERR_INVALID_CREDENTIALS', status: 401 });
  const submitVerify = vi.fn<SubmitEmailVerificationRequest>();
  const { result, onRefreshSession } = mount(submitEmail, submitVerify);
  result.form.setValue('email', 'lan@example.com');
  result.form.setValue('currentPassword', 'sai');
  await result.submit();
  expect(onRefreshSession).not.toHaveBeenCalled();
});

it('TC-925: bấm xác minh liên tiếp khi yêu cầu còn chờ chỉ gửi một lần và mở khoá sau phản hồi', async () => {
  let release!: () => void;
  const submitVerify = vi.fn<SubmitEmailVerificationRequest>(
    () =>
      new Promise((resolve) => {
        release = () => resolve({ ok: true, data: { sent: true } });
      }),
  );
  const { result } = mount(vi.fn<SubmitAccountEmailChange>(), submitVerify);
  const first = result.requestVerification();
  const duplicate = result.requestVerification();
  expect(submitVerify).toHaveBeenCalledTimes(1);
  await duplicate;
  release();
  await first;
  const next = result.requestVerification();
  expect(submitVerify).toHaveBeenCalledTimes(2);
  release();
  await next;
});
