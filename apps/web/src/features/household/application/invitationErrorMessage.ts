import { householdErrorMessage } from './householdErrorMessage';

export function invitationErrorMessage(code: string) {
  if (code === 'ERR_INVITATION_EXISTS')
    return 'Đã có lời mời còn hạn. Hãy mở danh sách để xem lại, thu hồi hoặc thay mã.';
  if (code === 'ERR_DELETION_PENDING') return 'Nhà đang chờ xoá. Chưa thể tạo hoặc thu hồi lời mời.';
  if (code === 'ERR_NOT_FOUND') return 'Lời mời không còn dùng được. Bạn có thể tạo lời mời mới.';
  if (code === 'UNKNOWN') return 'Chưa thể xử lý lời mời. Vui lòng thử lại.';
  const message = householdErrorMessage(code);
  return message === 'Không thể tạo nhà. Vui lòng thử lại.'
    ? 'Chưa thể xử lý lời mời. Vui lòng thử lại.'
    : message;
}
