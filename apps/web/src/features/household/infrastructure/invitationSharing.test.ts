import { afterEach, expect, it, vi } from 'vitest';
import { createInvitationSharing } from './invitationSharing';

afterEach(() => vi.unstubAllGlobals());
const invitation = { code: 'A7F29C4E8B1D', link: 'https://angia.example/invite#token=Secret' };
it('TC-773: chia sẻ nguyên link API, huỷ bảng chia sẻ không tự sao chép', async () => {
  const writeText = vi.fn();
  const share = vi.fn().mockRejectedValue(new DOMException('Huỷ', 'AbortError'));
  vi.stubGlobal('navigator', { share, clipboard: { writeText } });
  const port = createInvitationSharing();
  expect(await port.share!(invitation)).toBe('cancelled');
  expect(share).toHaveBeenCalledWith({
    title: 'Lời mời AN GIA',
    text: 'Mời bạn tham gia nhà trên AN GIA. Mã mời: A7F29C4E8B1D.',
    url: invitation.link,
  });
  expect(writeText).not.toHaveBeenCalled();
});
it('TC-773: không có Web Share thì chỉ cung cấp sao chép, chờ clipboard hoàn tất', async () => {
  const writeText = vi.fn().mockRejectedValue(new Error('Không cho phép'));
  vi.stubGlobal('navigator', { clipboard: { writeText } });
  const port = createInvitationSharing();
  expect(port.share).toBeUndefined();
  expect(await port.copy(invitation.link)).toBe(false);
  writeText.mockResolvedValue(undefined);
  expect(await port.copy(invitation.code)).toBe(true);
});
it('TC-773: thiếu clipboard hoặc share lỗi khác không được báo thành công', async () => {
  vi.stubGlobal('navigator', {
    share: async () => {
      throw new Error('Lỗi');
    },
  });
  const port = createInvitationSharing();
  expect(await port.copy('mã')).toBe(false);
  expect(await port.share!(invitation)).toBe('failed');
});
