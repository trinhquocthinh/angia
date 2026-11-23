import { householdErrorMessage } from './householdErrorMessage';

export function memberActionError(code: string, displayName?: string): string {
  const subject = displayName?.trim() || 'Thành viên này';
  if (code === 'ERR_LAST_GUARDIAN')
    return `${subject} là người giám hộ duy nhất của một hồ sơ trẻ. Thêm người giám hộ khác trước khi gỡ hoặc đổi vai trò.`;
  if (code === 'ERR_OWNER_PROTECTED') return 'Không thể thao tác với Chủ hộ.';
  if (code === 'ERR_NOT_FOUND') return 'Người này không còn trong nhà.';
  if (code === 'ERR_AUTH_UNAVAILABLE')
    return 'Hệ thống xác thực đang bận hoặc tạm gián đoạn. Vui lòng thử lại sau.';
  if (code === 'UNKNOWN') return 'Chưa thể cập nhật thành viên. Vui lòng thử lại.';
  const message = householdErrorMessage(code);
  return message === 'Không thể tạo nhà. Vui lòng thử lại.'
    ? 'Chưa thể cập nhật thành viên. Vui lòng thử lại.'
    : message;
}
