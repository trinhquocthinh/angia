import { formatHouseholdDateTime } from './formatHouseholdDateTime';
import { householdErrorMessage } from './householdErrorMessage';
import type { HouseholdHomeError } from './householdHomePorts';

export type HouseholdHomeErrorContext = 'ownership' | 'leave' | 'deletion';

const HOME_ERROR_MESSAGES: Record<string, string> = {
  ERR_OWNERSHIP_TRANSFER_PENDING: 'Đang có đề nghị trao quyền Chủ hộ chờ trả lời.',
  ERR_OWNER_MUST_TRANSFER: 'Hãy trao quyền Chủ hộ cho người khác trước khi rời nhà.',
  ERR_OWNER_MUST_DELETE_FAMILY: 'Bạn là người duy nhất trong nhà. Hãy xoá nhà thay vì rời nhà.',
  ERR_LAST_GUARDIAN:
    'Bạn là người giám hộ duy nhất của một hồ sơ trẻ. Thêm người giám hộ khác hoặc xoá hồ sơ trước.',
  ERR_FAMILY_NOT_EMPTY: 'Chỉ xoá được khi bạn là người duy nhất trong nhà.',
  ERR_DELETION_PENDING: 'Nhà đang có yêu cầu xoá chờ xử lý.',
};

export function householdHomeError(error: HouseholdHomeError, context: HouseholdHomeErrorContext): string {
  if (error.code === 'ERR_RECENT_REMOVAL') {
    const allowedAt = typeof error.details?.['allowedAt'] === 'string' ? error.details['allowedAt'] : '';
    const formatted = allowedAt ? formatHouseholdDateTime(allowedAt) : '';
    return formatted
      ? `Chưa thể xoá nhà. Bạn xoá được từ ${formatted}.`
      : 'Chưa thể xoá nhà do vừa gỡ thành viên gần đây.';
  }
  if (error.code === 'ERR_VALIDATION' && context === 'deletion') return 'Tên nhà chưa khớp.';
  if (error.code === 'ERR_NOT_FOUND' && context === 'ownership')
    return 'Đề nghị trao quyền không còn hiệu lực.';
  if (error.code === 'ERR_NOT_FOUND' && context === 'deletion') return 'Yêu cầu xoá nhà không còn hiệu lực.';
  if (Object.hasOwn(HOME_ERROR_MESSAGES, error.code)) return HOME_ERROR_MESSAGES[error.code]!;
  if (error.code === 'UNKNOWN') return 'Chưa thể thực hiện thao tác. Vui lòng thử lại.';
  const fallback = householdErrorMessage(error.code);
  return fallback === 'Không thể tạo nhà. Vui lòng thử lại.'
    ? 'Chưa thể thực hiện thao tác. Vui lòng thử lại.'
    : fallback;
}
