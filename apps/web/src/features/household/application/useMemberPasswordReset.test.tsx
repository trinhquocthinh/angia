import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import type { ResetMemberPassword } from './memberPorts';
import { useMemberPasswordReset } from './useMemberPasswordReset';

function probe(action: ResetMemberPassword, csrfToken = 'csrf') {
  let model!: ReturnType<typeof useMemberPasswordReset>;
  function Probe() {
    model = useMemberPasswordReset(action, csrfToken);
    return null;
  }
  renderToStaticMarkup(<Probe />);
  return model;
}

it('TC-756: đặt lại mật khẩu thành viên trả về mật khẩu tạm và hạn dùng, gọi đúng CSRF', async () => {
  const payload = { temporaryPassword: 'TempPass123!', expiresAt: '2026-11-24T04:30:00.000Z' };
  const action = vi.fn<ResetMemberPassword>().mockResolvedValue({ ok: true, value: payload });
  const outcome = await probe(action, 'csrf-1').resetPassword('member-hoa', 'Mẹ Hoa');
  expect(action).toHaveBeenCalledExactlyOnceWith('member-hoa', 'csrf-1');
  expect(outcome).toEqual({ status: 'ok', value: payload });
});

it('TC-757: ánh xạ đúng trạng thái cho ERR_OWNER_PROTECTED, ERR_NOT_FOUND, ERR_FORBIDDEN và ERR_RATE_LIMITED', async () => {
  expect(
    await probe(async () => ({ ok: false, code: 'ERR_OWNER_PROTECTED' })).resetPassword('owner-1', 'Ba Minh'),
  ).toEqual({ status: 'owner_protected', message: 'Không thể thao tác với Chủ hộ.' });
  expect(
    await probe(async () => ({ ok: false, code: 'ERR_NOT_FOUND' })).resetPassword('gone', 'Mẹ Hoa'),
  ).toEqual({ status: 'not_found', message: 'Người này không còn trong nhà.' });
  expect(
    await probe(async () => ({ ok: false, code: 'ERR_FORBIDDEN' })).resetPassword('hoa', 'Mẹ Hoa'),
  ).toEqual({ status: 'forbidden', message: 'Bạn không có quyền thực hiện thao tác này.' });
  expect(
    await probe(async () => ({ ok: false, code: 'ERR_RATE_LIMITED' })).resetPassword('hoa', 'Mẹ Hoa'),
  ).toEqual({ status: 'error', message: 'Bạn thao tác quá nhanh, vui lòng thử lại sau.' });
});

it('SPEC-062: chống gửi trùng khi đang gửi, thiếu CSRF bỏ qua và bắt lỗi mạng', async () => {
  let release!: () => void;
  const action = vi.fn<ResetMemberPassword>(
    () =>
      new Promise((resolve) => {
        release = () =>
          resolve({
            ok: true,
            value: { temporaryPassword: 'Abc12345!', expiresAt: '2026-11-24T04:30:00.000Z' },
          });
      }),
  );
  const model = probe(action);
  const first = model.resetPassword('hoa', 'Mẹ Hoa');
  expect(await model.resetPassword('hoa', 'Mẹ Hoa')).toEqual({ status: 'ignored' });
  expect(action).toHaveBeenCalledExactlyOnceWith('hoa', 'csrf');
  release();
  expect((await first).status).toBe('ok');

  expect(await probe(action, '').resetPassword('hoa', 'Mẹ Hoa')).toEqual({ status: 'ignored' });
  expect(
    await probe(async () => {
      throw new Error('offline');
    }).resetPassword('hoa', 'Mẹ Hoa'),
  ).toEqual({ status: 'error', message: 'Mất kết nối. Kiểm tra mạng rồi thử lại.' });
});
