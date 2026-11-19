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
        <Link to="/family/members" onClick={onClose}>
          <AdminIcon name="group" />
          Thành viên
        </Link>
      )}
      {session.family && session.role === 'main' && (
        <Link to="/family/invite" onClick={onClose}>
          <AdminIcon name="group_add" />
          Mời người thân
        </Link>
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
