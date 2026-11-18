import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import type { AcceptHouseholdInvitation } from './acceptInvitationPorts';
import { useAcceptHouseholdInvitation } from './useAcceptHouseholdInvitation';

function model(action: AcceptHouseholdInvitation, refresh = vi.fn(async () => undefined)) {
  let result!: ReturnType<typeof useAcceptHouseholdInvitation>;
  function Probe() {
    result = useAcceptHouseholdInvitation(action, 'csrf', refresh);
    return null;
  }
  renderToStaticMarkup(<Probe />);
  return { form: result, refresh };
}
it('TC-775: chuẩn hóa mã và gửi CSRF, chỉ tải phiên sau 204', async () => {
  const action = vi.fn<AcceptHouseholdInvitation>().mockResolvedValue({ ok: true });
  const { form, refresh } = model(action);
  form.form.setValue('code', 'a7f2 9c4e 8b1d');
  await form.submit();
  expect(action).toHaveBeenCalledExactlyOnceWith({ token: 'A7F29C4E8B1D' }, 'csrf');
  expect(refresh).toHaveBeenCalledOnce();
});
it('TC-775: mã sai định dạng không gọi API', async () => {
  const action = vi.fn<AcceptHouseholdInvitation>();
  const { form } = model(action);
  form.form.setValue('code', '123');
  await form.submit();
  expect(form.form.getFieldState('code').error).toBeDefined();
  expect(action).not.toHaveBeenCalled();
});
it('TC-777: mã không còn dùng được không chuyển vào nhà', async () => {
  const { form, refresh } = model(async () => ({ ok: false, code: 'ERR_NOT_FOUND' }));
  form.form.setValue('code', 'A7F29C4E8B1D');
  await form.submit();
  expect(refresh).not.toHaveBeenCalled();
});
it('TC-775: nhận xong mà GET phiên lỗi thì thử lại chỉ gọi GET, không POST lần hai', async () => {
  const action = vi.fn<AcceptHouseholdInvitation>().mockResolvedValue({ ok: true });
  const refresh = vi.fn(async () => {
    throw new Error('Mất mạng');
  });
  const { form } = model(action, refresh);
  form.form.setValue('code', 'A7F29C4E8B1D');
  await form.submit();
  await form.submit();
  expect(action).toHaveBeenCalledOnce();
  expect(refresh).toHaveBeenCalledTimes(2);
});
