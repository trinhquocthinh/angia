import { Link } from '@tanstack/react-router';
import { AccountSettings3DIcon } from '@src/features/account/presentation/settings/AccountSettings3DIcon';

export function AccountPasswordCard() {
  return (
    <section className="account-card account-tile-card" aria-labelledby="account-password-heading">
      <div className="account-card-title-group">
        <AccountSettings3DIcon name="lock-3d" />
        <h2 id="account-password-heading" className="account-card-title">
          Mật khẩu
        </h2>
      </div>
      <Link to="/account/change-password" className="account-secondary-btn account-password-link">
        Đổi mật khẩu
      </Link>
    </section>
  );
}
