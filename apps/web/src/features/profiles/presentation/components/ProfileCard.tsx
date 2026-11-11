import { Link } from '@tanstack/react-router';
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

export function ProfileCard({ profile, onConsent, onLink, onDelete, onWithdraw }: ProfileCardProps) {
  const action = profile.consentAction;
  return (
    <article className="flex flex-col rounded-2xl border border-border/30 bg-surface p-5 shadow-sm transition-all duration-200 hover:border-border/50 hover:shadow-md lg:rounded-3xl lg:p-6">
      <div className="flex items-start justify-between gap-3">
        {/* Lối vào hồ sơ ở mọi cỡ màn — dưới lg không có điều hướng hồ sơ nên đây là lối vào chính (LG-01). */}
        <Link
          to="/profiles/$profileId"
          params={{ profileId: profile.id }}
          className="flex min-h-11 min-w-0 items-center gap-3 rounded-2xl hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus lg:gap-3.5"
        >
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-lg font-semibold text-text-primary shadow-sm select-none lg:h-14 lg:w-14 lg:rounded-2xl lg:text-xl lg:font-bold"
            aria-hidden="true"
          >
            {profile.displayName.slice(0, 1)}
          </span>
          <div className="min-w-0">
            <h2 className="break-words text-xl leading-7 font-semibold text-text-primary lg:text-lg lg:leading-6">
              {profile.displayName}
            </h2>
            {profile.birthYear !== null && (
              <p className="text-xs font-semibold text-text-secondary lg:text-[13px] lg:leading-5 lg:font-normal">
                Năm sinh {profile.birthYear}
              </p>
            )}
          </div>
        </Link>
        <ProfileBasisBadge basis={profile.consentBasis} />
      </div>
      <ProfileConsentStatus profile={profile} />
      {(action === 'attestation' || action === 'self') && (
        <button
          className="mt-4 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl px-5 py-2.5 text-center text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus bg-accent text-on-accent"
          onClick={() => onConsent(profile)}
        >
          Xác nhận đồng ý
        </button>
      )}
      {!profile.hasLinkedAccount && (
        <button
          className="mt-4 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl px-5 py-2.5 text-center text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus bg-accent-soft text-accent"
          onClick={() => onLink(profile)}
        >
          Tạo link liên kết tài khoản
        </button>
      )}
      <ProfileCardActions
        profileId={profile.id}
        onDelete={() => onDelete(profile)}
        onWithdraw={profile.consentStatus === 'confirmed' ? onWithdraw : undefined}
      />
    </article>
  );
}
