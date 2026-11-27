export function registrationInvitationErrorMessage(code: string): string | null {
  if (code === 'ERR_NOT_FOUND')
    return 'Lời mời không còn dùng được. Bạn vẫn có thể tạo tài khoản nếu đăng ký đang mở.';
  if (code === 'ERR_DELETION_PENDING') return 'Nhà đang chờ xoá. Chưa thể nhận lời mời.';
  return null;
}
