import { invitationErrorMessage } from './invitationErrorMessage';

export function acceptInvitationErrorMessage(code: string, source: 'code' | 'link' = 'code'): string {
  if (code === 'ERR_ACCOUNT_ALREADY_IN_FAMILY')
    return 'Bạn đang thuộc một nhà. Hãy rời nhà hiện tại trước khi nhận lời mời khác.';
  if (code === 'ERR_DELETION_PENDING') return 'Nhà đang chờ xoá. Chưa thể nhận lời mời.';
  if (code === 'ERR_NOT_FOUND')
    return source === 'link'
      ? 'Lời mời không còn dùng được. Hãy nhờ người mời gửi link mới.'
      : 'Lời mời không còn dùng được. Hãy nhờ người mời gửi mã mới.';
  return invitationErrorMessage(code);
}
