import { Link } from '@tanstack/react-router';
import { ProfileConsentStatus } from './ProfileConsentStatus';
import { ProfileCardActions } from './ProfileCardActions';
import { ProfileBasisBadge } from './ProfileBasisBadge';
import type { ProfileListItem } from '../../application/ports';

type ProfileCardProps = {
  profile: ProfileListItem;
  onConsent: (profile: ProfileListItem) => void;
  onDelete: (profile: ProfileListItem) => void;
  onWithdraw?: (() => void) | undefined;
};

export function ProfileCard({ profile, onConsent, onDelete, onWithdraw }: ProfileCardProps) {
  const action = profile.consentAction;
  return (
    <article className="flex flex-col rounded-2xl border border-[#bfc9c4]/30 bg-white p-5 shadow-sm transition-all duration-200 hover:border-[#bfc9c4]/50 hover:shadow-md lg:rounded-3xl lg:p-6">
      <div className="flex items-start justify-between gap-3">
        {/* Lối vào hồ sơ ở mọi cỡ màn — dưới lg không có điều hướng hồ sơ nên đây là lối vào chính (LG-01). */}
        <Link
          to="/profiles/$profileId"
          params={{ profileId: profile.id }}
          className="flex min-h-11 min-w-0 items-center gap-3 rounded-2xl hover:text-[#004135] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#286958] lg:gap-3.5"
        >
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#aef0da] text-lg font-semibold text-[#002019] shadow-sm select-none lg:h-14 lg:w-14 lg:rounded-2xl lg:text-xl lg:font-bold"
            aria-hidden="true"
          >
            {profile.displayName.slice(0, 1)}
          </span>
          <div className="min-w-0">
            <h2 className="break-words text-xl leading-7 font-semibold text-[#131d1d] lg:text-lg lg:leading-6">
              {profile.displayName}
            </h2>
            {profile.birthYear !== null && (
              <p className="text-xs font-semibold text-[#404945] lg:text-[13px] lg:leading-5 lg:font-normal">
                Năm sinh {profile.birthYear}
              </p>
            )}
          </div>
        </Link>
        <ProfileBasisBadge basis={profile.consentBasis} />
      </div>
      <ProfileConsentStatus profile={profile} />
      {action && (
        <button
          className="mt-4 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-[#004135] px-5 py-2.5 text-center text-sm font-semibold text-white disabled:cursor-default disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#286958]"
          onClick={() => onConsent(profile)}
        >
          {action !== 'invitation'
            ? 'Xác nhận đồng ý'
            : profile.consentStatus === 'invited'
              ? 'Quản lý link xác nhận'
              : 'Tạo link mời người thân'}
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
