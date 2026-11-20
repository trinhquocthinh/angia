import { Link } from '@tanstack/react-router';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import type { AccountMenuProps } from './accountMenuTypes';

export function AccountMenuDestinations({
  session,
  onClose,
}: Pick<AccountMenuProps, 'session'> & { onClose?: (() => void) | undefined }) {
  if (!session.account.healthProfileId && !session.account.isSystemAdmin && !session.family) return null;
  return (
    <div className="account-menu-links">
      {session.family && (
        <>
          <Link to="/family/members" onClick={onClose}>
            <AdminIcon name="group" />
            Thành viên
          </Link>
          <Link to="/family/home" onClick={onClose}>
            <AdminIcon name="home_health" />
            Nhà của tôi
          </Link>
        </>
      )}
      {session.account.healthProfileId && (
        <Link to="/my-profile" onClick={onClose}>
          <AdminIcon name="person" />
          Hồ sơ của tôi
        </Link>
      )}
      {session.account.isSystemAdmin && (
        <Link to="/admin" onClick={onClose}>
          <AdminIcon name="admin_panel_settings" />
          Quản trị hệ thống
        </Link>
      )}
    </div>
  );
}
