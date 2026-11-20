import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import type { LeaveHouseholdAction } from './householdHomePorts';
import { useLeaveHousehold } from './useLeaveHousehold';

function probe(action: LeaveHouseholdAction, csrfToken = 'csrf') {
  let result!: ReturnType<typeof useLeaveHousehold>;
  function Probe() {
    result = useLeaveHousehold(action, csrfToken);
    return null;
  }
  renderToStaticMarkup(<Probe />);
  return result;
}

it('SPEC-067: rời nhà trả về ok hoặc mã lỗi 409 đúng đặc tả', async () => {
  expect(await probe(async () => ({ ok: true, value: undefined })).leave('keep')).toEqual({ status: 'ok' });
  expect(
    await probe(async () => ({ ok: false, error: { code: 'ERR_OWNER_MUST_TRANSFER' } })).leave('keep'),
  ).toEqual({
    status: 'error',
    code: 'ERR_OWNER_MUST_TRANSFER',
    message: 'Hãy trao quyền Chủ hộ cho người khác trước khi rời nhà.',
  });
  expect(
    await probe(async () => ({ ok: false, error: { code: 'ERR_LAST_GUARDIAN' } })).leave('delete'),
  ).toEqual({
    status: 'error',
    code: 'ERR_LAST_GUARDIAN',
    message: 'Bạn là người giám hộ duy nhất của một hồ sơ trẻ. Thêm người giám hộ khác hoặc xoá hồ sơ trước.',
  });
});

it('SPEC-067: chống gửi trùng khi đang rời nhà', async () => {
  let release!: () => void;
  const action = vi.fn<LeaveHouseholdAction>(
    () =>
      new Promise((resolve) => {
        release = () => resolve({ ok: true, value: undefined });
      }),
  );
  const model = probe(action);
  const first = model.leave('keep');
  expect(await model.leave('keep')).toEqual({ status: 'ignored' });
  expect(action).toHaveBeenCalledExactlyOnceWith('keep', 'csrf');
  release();
  expect(await first).toEqual({ status: 'ok' });
});
