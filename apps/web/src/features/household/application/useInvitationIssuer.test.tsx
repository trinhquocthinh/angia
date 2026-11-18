import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { useInvitationIssuer } from './useInvitationIssuer';
import type { CreateInvitation } from './invitationPorts';

function model(action: CreateInvitation) {
  let result!: ReturnType<typeof useInvitationIssuer>;
  function Probe() {
    result = useInvitationIssuer(action, 'csrf');
    return null;
  }
  renderToStaticMarkup(<Probe />);
  return result;
}
const issued = {
  invitationId: 'id',
  code: 'A7F29C4E8B1D',
  link: 'https://angia.example/invite#token=secret',
  expiresAt: '2026-11-25T07:30:00.000Z',
};

it('TC-773: tạo theo vai trò đã chọn, không phát hành thêm khi đã có mã', async () => {
  const create = vi.fn<CreateInvitation>().mockResolvedValue({ ok: true, value: issued });
  const form = model(create);
  await form.issue('member');
  await form.issue('main');
  expect(create).toHaveBeenCalledExactlyOnceWith({ kind: 'join_family', role: 'member' }, 'csrf');
});
it('TC-773: bấm hai lần khi request đang chờ chỉ tạo một lời mời', async () => {
  let release!: (value: { ok: true; value: typeof issued }) => void;
  const create = vi.fn<CreateInvitation>(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  const form = model(create);
  const first = form.issue('main');
  await form.issue('member');
  expect(create).toHaveBeenCalledOnce();
  release({ ok: true, value: issued });
  await first;
});
it('TC-773: lỗi phát hành cho phép thử lại, không giữ message nội bộ', async () => {
  const create = vi
    .fn<CreateInvitation>()
    .mockResolvedValueOnce({ ok: false, code: 'ERR_RATE_LIMITED' })
    .mockResolvedValueOnce({ ok: true, value: issued });
  const form = model(create);
  await form.issue('member');
  await form.issue('member');
  expect(create).toHaveBeenCalledTimes(2);
});
