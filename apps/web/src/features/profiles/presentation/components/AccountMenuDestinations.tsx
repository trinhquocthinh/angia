import { AccountMenuItem } from './AccountMenuItem';
import type { AccountMenuProps } from './accountMenuTypes';

export function AccountMenuDestinations({
  session,
  onClose,
}: Pick<AccountMenuProps, 'session'> & { onClose?: (() => void) | undefined }) {
  if (!session.account.healthProfileId && !session.account.isSystemAdmin && !session.family) return null;
  return (
    <div className="account-menu-links">
      {session.family && (
        <AccountMenuItem
          to="/family/home"
          icon="home"
          label="Nhà của tôi"
          description="Thành viên & thông tin nhà"
          onClose={onClose}
        />
      )}
      {session.account.healthProfileId && (
        <AccountMenuItem
          to="/my-profile"
          icon="profile"
          label="Hồ sơ của tôi"
          description="Thuốc & sức khoẻ của bạn"
          onClose={onClose}
        />
      )}
      {session.account.isSystemAdmin && (
        <AccountMenuItem
          to="/admin"
          icon="settings"
          label="Quản trị hệ thống"
          description="Tài khoản & gia đình"
          onClose={onClose}
        />
      )}
    </div>
  );
}
