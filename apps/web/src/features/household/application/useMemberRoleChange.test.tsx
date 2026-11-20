import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import type { ChangeMemberRole } from './memberPorts';
import { useMemberRoleChange } from './useMemberRoleChange';

function probe(action: ChangeMemberRole, csrfToken = 'csrf') {
  let result!: ReturnType<typeof useMemberRoleChange>;
  function Probe() {
    result = useMemberRoleChange(action, csrfToken);
    return null;
  }
  renderToStaticMarkup(<Probe />);
  return result;
}

it('SPEC-066: đổi vai trò trả về ok, not_found hoặc error theo kết quả API', async () => {
  expect(
    await probe(async () => ({ ok: true, value: undefined })).changeRole('id-1', 'member', 'Anh Tuấn'),
  ).toEqual({ status: 'ok' });
  expect(
    await probe(async () => ({ ok: false, code: 'ERR_NOT_FOUND' })).changeRole('id-1', 'member', 'Anh Tuấn'),
  ).toEqual({ status: 'not_found', message: 'Người này không còn trong nhà.' });
  expect(
    await probe(async () => ({ ok: false, code: 'ERR_LAST_GUARDIAN' })).changeRole(
      'id-1',
      'member',
      'Anh Tuấn',
    ),
  ).toEqual({
    status: 'error',
    message:
      'Anh Tuấn là người giám hộ duy nhất của một hồ sơ trẻ. Thêm người giám hộ khác trước khi gỡ hoặc đổi vai trò.',
  });
});

it('SPEC-066: chống gửi trùng khi đang đổi vai trò và xử lý lỗi mạng', async () => {
  let release!: () => void;
  const action = vi.fn<ChangeMemberRole>(
    () =>
      new Promise((resolve) => {
        release = () => resolve({ ok: true, value: undefined });
      }),
  );
  const model = probe(action);
  const first = model.changeRole('id-1', 'main', 'Mẹ Hoa');
  expect(await model.changeRole('id-1', 'main', 'Mẹ Hoa')).toEqual({ status: 'ignored' });
  expect(action).toHaveBeenCalledExactlyOnceWith('id-1', 'main', 'csrf');
  release();
  expect(await first).toEqual({ status: 'ok' });

  expect(
    await probe(async () => {
      throw new Error('offline');
    }).changeRole('id-1', 'member', 'Mẹ Hoa'),
  ).toEqual({ status: 'error', message: 'Mất kết nối. Kiểm tra mạng rồi thử lại.' });
});
