import type { InvitationRole } from '../application/invitationPorts';
// Chỉ lưu lựa chọn vai trò, không lưu mã/link/token.
export const invitationRolePreference = {
  read(scope: string): InvitationRole | null {
    try {
      const value = localStorage.getItem(`angia-invitation-role:${scope}`);
      return value === 'main' || value === 'member' ? value : null;
    } catch {
      return null;
    }
  },
  write(scope: string, value: InvitationRole) {
    try {
      localStorage.setItem(`angia-invitation-role:${scope}`, value);
    } catch {
      /* Không có storage vẫn dùng được màn. */
    }
  },
};
