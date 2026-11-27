import type { AdminAuditAction } from './ports';
export const adminAuditActionLabels: Record<AdminAuditAction, string> = {
  account_locked: 'Khoá tài khoản',
  account_unlocked: 'Mở khoá tài khoản',
  registration_switch_changed: 'Đổi công tắc mở đăng ký',
  email_changed: 'Đổi email',
  password_reset_by_email: 'Đặt lại mật khẩu qua email',
  password_reset_by_family: 'Đặt lại mật khẩu bởi người trong nhà',
  guardian_added: 'Thêm người giám hộ',
  guardian_removed: 'Gỡ người giám hộ',
  family_created: 'Tạo nhà',
  invitation_created: 'Tạo lời mời',
  invitation_revoked: 'Thu hồi lời mời',
  invitation_accepted: 'Xác nhận lời mời',
  member_role_changed: 'Đổi vai trò thành viên',
  member_removed: 'Gỡ thành viên',
  member_left: 'Thành viên rời nhà',
  ownership_transfer_offered: 'Đề nghị chuyển Chủ hộ',
  ownership_transfer_accepted: 'Chấp nhận chuyển Chủ hộ',
  ownership_transfer_declined: 'Từ chối chuyển Chủ hộ',
  ownership_transfer_revoked: 'Thu hồi đề nghị chuyển Chủ hộ',
  family_deletion_requested: 'Yêu cầu xoá nhà',
  family_deletion_revoked: 'Thu hồi yêu cầu xoá nhà',
  family_deletion_executed: 'Đã xoá nhà',
  account_deleted: 'Xoá tài khoản',
};
export function adminAuditActionLabel(action: string): string {
  return Object.hasOwn(adminAuditActionLabels, action)
    ? adminAuditActionLabels[action as AdminAuditAction]
    : action;
}
