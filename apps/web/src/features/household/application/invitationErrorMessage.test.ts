import { expect, it } from 'vitest';
import { invitationErrorMessage } from './invitationErrorMessage';

it('TC-777: không khẳng định đã hết hạn hoặc thu hồi khi API chỉ trả không tìm thấy', () => {
  expect(invitationErrorMessage('ERR_NOT_FOUND')).toBe(
    'Lời mời không còn dùng được. Bạn có thể tạo lời mời mới.',
  );
  expect(invitationErrorMessage('ERR_DELETION_PENDING')).toContain('Nhà đang chờ xoá');
  expect(invitationErrorMessage('ERR_FORBIDDEN')).toContain('không có quyền');
  expect(invitationErrorMessage('UNKNOWN')).toBe('Chưa thể xử lý lời mời. Vui lòng thử lại.');
  expect(invitationErrorMessage('SERVER_PRIVATE_ERROR')).toBe('Chưa thể xử lý lời mời. Vui lòng thử lại.');
});
