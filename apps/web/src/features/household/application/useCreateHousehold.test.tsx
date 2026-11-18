import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { useCreateHousehold } from './useCreateHousehold';
import type { SubmitHousehold } from './ports';

function model(action: SubmitHousehold, refresh = vi.fn(async () => undefined)) {
  let form!: ReturnType<typeof useCreateHousehold>;
  function Probe() {
    form = useCreateHousehold(action, 'csrf', refresh);
    return null;
  }
  renderToStaticMarkup(<Probe />);
  return { form, refresh };
}
it('TC-767: gửi tên đã chuẩn hóa cùng CSRF, làm mới phiên sau khi API thành công', async () => {
  const action = vi.fn<SubmitHousehold>().mockResolvedValue({ ok: true });
  const { form, refresh } = model(action);
  form.form.setValue('name', ' Nhà Lan ');
  await form.submit();
  expect(action).toHaveBeenCalledWith({ name: 'Nhà Lan' }, 'csrf');
  expect(refresh).toHaveBeenCalledOnce();
});
it('TC-767: lỗi tên không gọi API hoặc làm mới phiên', async () => {
  const action = vi.fn<SubmitHousehold>();
  const { form, refresh } = model(action);
  form.form.setValue('name', ' ');
  await form.submit();
  expect(form.form.getFieldState('name').error?.message).toBe('Vui lòng nhập tên nhà.');
  expect(action).not.toHaveBeenCalled();
  expect(refresh).not.toHaveBeenCalled();
});
it('TC-769: đăng ký đóng không chuyển vào nhà', async () => {
  const { form, refresh } = model(async () => ({ ok: false, code: 'ERR_REGISTRATION_CLOSED' }));
  form.form.setValue('name', 'Nhà Lan');
  await form.submit();
  expect(refresh).not.toHaveBeenCalled();
});
it('TC-768: đã thuộc nhà thì làm mới phiên thay vì gửi lại thao tác tạo', async () => {
  const { form, refresh } = model(async () => ({ ok: false, code: 'ERR_ACCOUNT_ALREADY_IN_FAMILY' }));
  form.form.setValue('name', 'Nhà Lan');
  await form.submit();
  expect(refresh).toHaveBeenCalledOnce();
});
it('TC-771: hai lần gửi khi request chưa xong chỉ gọi API một lần', async () => {
  let release!: (value: { ok: true }) => void;
  const action = vi.fn<SubmitHousehold>(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  const { form } = model(action);
  form.form.setValue('name', 'Nhà Lan');
  const first = form.submit();
  await vi.waitFor(() => expect(action).toHaveBeenCalledOnce());
  await form.submit();
  release({ ok: true });
  await first;
  expect(action).toHaveBeenCalledOnce();
});
it('TC-767: lỗi tải phiên sau khi tạo không gửi POST lần hai khi thử lại', async () => {
  const action = vi.fn<SubmitHousehold>().mockResolvedValue({ ok: true });
  const refresh = vi.fn(async () => {
    throw new Error('mất mạng');
  });
  const { form } = model(action, refresh);
  form.form.setValue('name', 'Nhà Lan');
  await form.submit();
  await form.submit();
  expect(action).toHaveBeenCalledOnce();
  expect(refresh).toHaveBeenCalledTimes(2);
});
