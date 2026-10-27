import { Link } from '@tanstack/react-router';
import { ProfileConsentStatus } from './ProfileConsentStatus';
import type { ProfileListItem } from '../../application/ports';
export function ProfileCard({
  profile,
  onConsent,
  onDelete,
}: {
  profile: ProfileListItem;
  onConsent: (profile: ProfileListItem) => void;
  onDelete: (profile: ProfileListItem) => void;
}) {
  const action = profile.consentAction;
  return (
    <article className="flex min-h-[280px] flex-col rounded-[20px] bg-white p-6 shadow-sm">
      {/* Lối vào hồ sơ ở mọi cỡ màn — dưới lg sidebar ẩn nên đây là lối vào duy nhất (LG-01). */}
      <Link
        to="/profiles/$profileId"
        params={{ profileId: profile.id }}
        className="flex min-h-11 items-center gap-3 rounded-2xl hover:text-[#004135] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#286958]"
      >
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
      </Link>
      <ProfileConsentStatus profile={profile} />
      <Link
        to="/profiles/$profileId"
        params={{ profileId: profile.id }}
        className="mt-5 inline-flex min-h-[52px] items-center justify-center rounded-xl border border-[#004135] px-5 py-3 text-center text-sm font-semibold text-[#004135] hover:bg-[#e4f0f0] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#286958]"
      >
        Xem hồ sơ
      </Link>
      {action && (
        <button
          className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-[#004135] px-5 py-3 text-center text-sm font-semibold text-white cursor-pointer disabled:opacity-55 disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#286958] mt-5"
          onClick={() => onConsent(profile)}
        >
          {action !== 'invitation'
            ? 'Xác nhận đồng ý'
            : profile.consentStatus === 'invited'
              ? 'Quản lý link xác nhận'
              : 'Tạo link mời người thân'}
        </button>
      )}
      <button
        className="mt-auto self-start pt-5 text-sm font-semibold text-[#b42318] underline-offset-4 cursor-pointer hover:underline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#286958]"
        onClick={() => onDelete(profile)}
      >
        Xóa hồ sơ
      </button>
    </article>
  );
}
