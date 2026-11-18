import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { useInvitationSharing } from './useInvitationSharing';

it('TC-773: đang sao chép không mở thêm bảng chia sẻ, kết thúc mới cho gửi tiếp', async () => {
  let release!: (ok: boolean) => void;
  const copy = vi.fn(
    () =>
      new Promise<boolean>((resolve) => {
        release = resolve;
      }),
  );
  const share = vi.fn(async () => 'cancelled' as const);
  let form!: ReturnType<typeof useInvitationSharing>;
  function Probe() {
    form = useInvitationSharing({ copy, share });
    return null;
  }
  renderToStaticMarkup(<Probe />);
  const pending = form.copy('mã', 'Đã sao chép');
  await form.share({
    invitationId: 'id',
    code: 'A7F29C4E8B1D',
    link: 'https://angia.example/invite#token=secret',
    expiresAt: '2026-11-25T00:00:00Z',
  });
  expect(share).not.toHaveBeenCalled();
  release(true);
  await pending;
  await form.share({
    invitationId: 'id',
    code: 'A7F29C4E8B1D',
    link: 'https://angia.example/invite#token=secret',
    expiresAt: '2026-11-25T00:00:00Z',
  });
  expect(share).toHaveBeenCalledOnce();
});
