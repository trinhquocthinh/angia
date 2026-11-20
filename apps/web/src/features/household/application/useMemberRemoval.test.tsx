import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import type { RemoveMember } from './memberPorts';
import { useMemberRemoval } from './useMemberRemoval';

function probe(action: RemoveMember, csrfToken = 'csrf') {
  let result!: ReturnType<typeof useMemberRemoval>;
  function Probe() {
    result = useMemberRemoval(action, csrfToken);
    return null;
  }
  renderToStaticMarkup(<Probe />);
  return result;
}

it('SPEC-066: gỡ thành viên trả về ok, not_found hoặc error đúng mã lỗi', async () => {
  expect(await probe(async () => ({ ok: true, value: undefined })).remove('id-1', 'Anh Tuấn')).toEqual({
    status: 'ok',
  });
  expect(await probe(async () => ({ ok: false, code: 'ERR_NOT_FOUND' })).remove('id-1', 'Anh Tuấn')).toEqual({
    status: 'not_found',
    message: 'Người này không còn trong nhà.',
  });
  expect(
    await probe(async () => ({ ok: false, code: 'ERR_LAST_GUARDIAN' })).remove('id-1', 'Anh Tuấn'),
  ).toEqual({
    status: 'error',
    message:
      'Anh Tuấn là người giám hộ duy nhất của một hồ sơ trẻ. Thêm người giám hộ khác trước khi gỡ hoặc đổi vai trò.',
  });
});

it('SPEC-066: chống gửi trùng khi đang gỡ và xử lý lỗi mạng', async () => {
  let release!: () => void;
  const action = vi.fn<RemoveMember>(
    () =>
      new Promise((resolve) => {
        release = () => resolve({ ok: true, value: undefined });
      }),
  );
  const model = probe(action);
  const first = model.remove('id-1', 'Mẹ Hoa');
  expect(await model.remove('id-1', 'Mẹ Hoa')).toEqual({ status: 'ignored' });
  expect(action).toHaveBeenCalledExactlyOnceWith('id-1', 'csrf');
  release();
  expect(await first).toEqual({ status: 'ok' });

  expect(
    await probe(async () => {
      throw new Error('offline');
    }).remove('id-1', 'Mẹ Hoa'),
  ).toEqual({ status: 'error', message: 'Mất kết nối. Kiểm tra mạng rồi thử lại.' });
});
