import { Link } from '@tanstack/react-router';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import { currentVietnamYear } from '../../application/currentVietnamYear';
import { ProfileConsentStatus } from './ProfileConsentStatus';
import { ProfileCardActions } from './ProfileCardActions';
import { ProfileBasisBadge } from './ProfileBasisBadge';
import type { ProfileListItem } from '../../application/ports';

type ProfileCardProps = {
  profile: ProfileListItem;
  onConsent: (profile: ProfileListItem) => void;
  onLink: (profile: ProfileListItem) => void;
  onDelete: (profile: ProfileListItem) => void;
  onWithdraw?: (() => void) | undefined;
};

const primaryBtn =
  'mt-3.5 inline-flex min-h-btn cursor-pointer items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-2.5 text-center text-button-primary font-semibold text-on-accent transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus';
const secondaryBtn =
  'mt-3 inline-flex min-h-btn cursor-pointer items-center justify-center gap-2 rounded-2xl bg-accent-soft px-4 py-2.5 text-center text-button-secondary font-semibold text-accent transition-colors hover:bg-choice-soft focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus';

export function ProfileCard({ profile, onConsent, onLink, onDelete, onWithdraw }: ProfileCardProps) {
  const action = profile.consentAction;
  const confirmed = profile.consentStatus === 'confirmed';
  return (
    <article className="profile-member-card flex flex-col p-5 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <Link
          to="/profiles/$profileId"
          params={{ profileId: profile.id }}
          className="flex min-h-12 min-w-0 items-center gap-3.5 rounded-2xl hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus"
        >
          <span className="profile-ceramic-avatar" aria-hidden="true">
            {profile.displayName.slice(0, 1)}
            {confirmed && (
              <span className="profile-ceramic-badge">
                <AdminIcon name="verified_user" size={14} />
              </span>
            )}
          </span>
          <div className="min-w-0">
            <h2 className="auth-heading break-words text-heading-2 font-semibold text-text-primary">
              {profile.displayName}
            </h2>
            {profile.birthYear !== null && (
              <p className="text-caption text-text-secondary">
                {currentVietnamYear() - profile.birthYear} tuổi · Năm sinh {profile.birthYear}
              </p>
            )}
          </div>
        </Link>
        <ProfileBasisBadge basis={profile.consentBasis} />
      </div>
      <ProfileConsentStatus profile={profile} />
      {(action === 'attestation' || action === 'self') && (
        <button type="button" className={primaryBtn} onClick={() => onConsent(profile)}>
          <AdminIcon name="check_circle" size={20} />
          Xác nhận đồng ý
        </button>
      )}
      {!profile.hasLinkedAccount && (
        <button type="button" className={secondaryBtn} onClick={() => onLink(profile)}>
          <AdminIcon name="badge" size={18} />
          Tạo link liên kết tài khoản
        </button>
      )}
      <ProfileCardActions
        profileId={profile.id}
        onDelete={() => onDelete(profile)}
        onWithdraw={confirmed ? onWithdraw : undefined}
      />
    </article>
  );
}
