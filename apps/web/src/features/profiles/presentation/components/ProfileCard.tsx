import { ProfileConsentStatus } from './ProfileConsentStatus';
import type { HealthProfile } from '../../application/ports';
export function ProfileCard({
  profile,
  onConsent,
}: {
  profile: HealthProfile;
  onConsent: (profile: HealthProfile) => void;
}) {
  const confirmed = profile.consentStatus === 'confirmed' && profile.consentSource === 'invitation';
  return (
    <article className="flex min-h-[280px] flex-col rounded-[20px] bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#b3eddf] text-2xl font-semibold text-[#004135]"
          aria-hidden="true"
        >
          {profile.displayName.slice(0, 1)}
        </span>
        <div className="min-w-0">
          <h2 className="break-words text-xl font-semibold">{profile.displayName}</h2>
          {profile.birthYear !== null && (
            <p className="mt-1 text-sm text-[#55615f]">Năm sinh {profile.birthYear}</p>
          )}
        </div>
      </div>
      <ProfileConsentStatus profile={profile} />
      {!confirmed && (
        <button
          className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-[#004135] px-5 py-3 text-center text-sm font-semibold text-white cursor-pointer disabled:opacity-55 disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#286958] mt-5"
          onClick={() => onConsent(profile)}
        >
          {profile.consentStatus === 'invited' ? 'Quản lý link đồng thuận' : 'Tạo link đồng thuận'}
        </button>
      )}
    </article>
  );
}
