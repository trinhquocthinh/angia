import type { ProfileSession } from '../../application/ports';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import { roleLabel } from './roleLabel';
export function AccountMenuIdentity({
  session,
  onClose,
}: {
  session: ProfileSession;
  onClose?: (() => void) | undefined;
}) {
  return (
    <div className="account-menu-identity">
      <span className="account-menu-initial" aria-hidden="true">
        {session.account.displayName.trim().slice(0, 1).toLocaleUpperCase('vi-VN')}
        <i />
      </span>
      <div className="account-menu-person">
        <strong>{session.account.displayName}</strong>
        <span title={session.emailStatus?.email ?? undefined}>
          {session.emailStatus?.email ?? 'Tài khoản AN GIA'}
        </span>
      </div>
      <span className="account-menu-role">
        <i />
        {roleLabel(session.role)}
      </span>
      <button type="button" aria-label="Đóng bảng tài khoản" className="account-menu-close" onClick={onClose}>
        <AdminIcon name="close" />
      </button>
    </div>
  );
}
