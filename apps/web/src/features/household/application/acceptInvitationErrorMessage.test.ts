import { expect, it } from 'vitest';
import { acceptInvitationErrorMessage } from './acceptInvitationErrorMessage';

it('SPEC-065: thông báo dùng chung hướng dẫn gửi lại mã hoặc link đúng nguồn', () => {
  expect(acceptInvitationErrorMessage('ERR_NOT_FOUND')).toBe(
    'Lời mời không còn dùng được. Hãy nhờ người mời gửi mã mới.',
  );
  expect(acceptInvitationErrorMessage('ERR_NOT_FOUND', 'link')).toBe(
    'Lời mời không còn dùng được. Hãy nhờ người mời gửi link mới.',
  );
});
it('SPEC-065: nhận lời mời giữ thông báo đã có nhà, đang xoá và lỗi mạng', () => {
  expect(acceptInvitationErrorMessage('ERR_ACCOUNT_ALREADY_IN_FAMILY')).toContain('Hãy rời nhà hiện tại');
  expect(acceptInvitationErrorMessage('ERR_DELETION_PENDING')).toBe(
    'Nhà đang chờ xoá. Chưa thể nhận lời mời.',
  );
  expect(acceptInvitationErrorMessage('NETWORK')).toBe('Mất kết nối. Kiểm tra mạng rồi thử lại.');
});
