import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import type { RevokeInvitation } from './invitationPorts';
import { useInvitationRevocation } from './useInvitationRevocation';

function model(action: RevokeInvitation) {
  let result!: ReturnType<typeof useInvitationRevocation>;
  function Probe() {
    result = useInvitationRevocation(action, 'csrf');
    return null;
  }
  renderToStaticMarkup(<Probe />);
  return result;
}
it('TC-777: thu hồi thành công hoặc không còn dùng được thì đóng xác nhận', async () => {
  expect(await model(async () => ({ ok: true, value: undefined })).revoke('id')).toBe(true);
  expect(await model(async () => ({ ok: false, code: 'ERR_NOT_FOUND' })).revoke('id')).toBe(true);
});
it('TC-777: lỗi mạng phải giữ xác nhận để thử lại', async () => {
  expect(
    await model(async () => {
      throw new Error('mất mạng');
    }).revoke('id'),
  ).toBe(false);
  expect(await model(async () => ({ ok: false, code: 'ERR_FORBIDDEN' })).revoke('id')).toBe(false);
});
it('TC-777: thu hồi đang chờ không gửi DELETE lần hai', async () => {
  let release!: () => void;
  const action = vi.fn<RevokeInvitation>(
    () =>
      new Promise((resolve) => {
        release = () => resolve({ ok: true, value: undefined });
      }),
  );
  const form = model(action);
  const pending = form.revoke('id');
  expect(await form.revoke('id')).toBe(false);
  expect(action).toHaveBeenCalledExactlyOnceWith('id', 'csrf');
  release();
  expect(await pending).toBe(true);
});
