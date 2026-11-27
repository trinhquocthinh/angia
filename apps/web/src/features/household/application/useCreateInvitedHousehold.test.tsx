import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { useCreateHousehold } from './useCreateHousehold';
import type { SubmitHousehold } from './ports';
import {
  capturePendingInvitation,
  clearPendingInvitation,
  readPendingInvitation,
} from './pendingHouseholdInvitation';
const token = 'a'.repeat(43);
afterEach(clearPendingInvitation);
function mount(action: SubmitHousehold, refresh: () => Promise<unknown> = vi.fn(async () => undefined)) {
  capturePendingInvitation(
    { pathname: '/invite', hash: `#token=${token}`, search: '' },
    { state: null, replaceState: vi.fn() },
  );
  let model!: ReturnType<typeof useCreateHousehold>;
  function Probe() {
    model = useCreateHousehold(action, 'csrf', refresh, token);
    return null;
  }
  renderToStaticMarkup(<Probe />);
  model.form.setValue('name', ' Nhà Lan ');
  return { model, refresh };
}
it('SPEC-065: lập nhà gửi tên và token, xoá token trước khi tải phiên', async () => {
  const action = vi.fn<SubmitHousehold>().mockResolvedValue({ ok: true });
  const refresh = vi.fn(async () => {
    expect(readPendingInvitation()).toBeNull();
  });
  const { model } = mount(action, refresh);
  await model.submit();
  expect(action).toHaveBeenCalledExactlyOnceWith({ name: 'Nhà Lan', invitationToken: token }, 'csrf');
  expect(refresh).toHaveBeenCalledOnce();
});
it.each(['ERR_NOT_FOUND', 'ERR_REGISTRATION_CLOSED'])(
  'SPEC-065: lời mời lập nhà %s bị xoá và không gửi lại',
  async (code) => {
    const action = vi.fn<SubmitHousehold>().mockResolvedValue({ ok: false, code });
    const { model, refresh } = mount(action);
    await model.submit();
    expect(readPendingInvitation()).toBeNull();
    await model.submit();
    expect(action).toHaveBeenCalledOnce();
    expect(refresh).not.toHaveBeenCalled();
  },
);
it('SPEC-065: tạo xong GET lỗi chỉ GET lại, không tạo nhà lần hai', async () => {
  const action = vi.fn<SubmitHousehold>().mockResolvedValue({ ok: true });
  const refresh = vi.fn(async () => {
    throw new Error('Mất mạng');
  });
  const { model } = mount(action, refresh);
  await model.submit();
  await model.submit();
  expect(action).toHaveBeenCalledOnce();
  expect(refresh).toHaveBeenCalledTimes(2);
});
