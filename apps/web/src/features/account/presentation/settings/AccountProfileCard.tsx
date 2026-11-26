import type { AccountProfileModel } from '@src/features/account/application/accountProfileModel';

export function AccountProfileCard({ profile }: { profile: AccountProfileModel }) {
  return (
    <section className="account-card account-profile-card" aria-labelledby="account-profile-heading">
      <h2 id="account-profile-heading" className="sr-only">
        Thông tin tài khoản
      </h2>
      <div className="account-profile-row">
        <span className="account-avatar" aria-hidden="true">
          <span className="account-avatar-inner">{profile.initial}</span>
        </span>
        <div className="account-profile-meta">
          <dl className="account-profile-name">
            <dt className="account-profile-label">Tên hiển thị</dt>
            <dd className="account-profile-value">{profile.displayName}</dd>
          </dl>
          <div className="account-profile-tags">
            <dl className="account-profile-chip">
              <dt className="account-chip-label">Nhà</dt>
              <dd className="account-chip-value">{profile.familyName}</dd>
            </dl>
            {profile.roleLabel && (
              <dl className="account-profile-chip account-profile-role">
                <dt className="account-chip-label">Vai trò</dt>
                <dd className="account-chip-value">{profile.roleLabel}</dd>
              </dl>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
