import type { ReactNode } from 'react';
import { profileShowsVitals } from '@src/features/profiles/application/profileShowsVitals';
import { currentVietnamYear } from '@src/features/profiles/application/currentVietnamYear';
import { ProfileEditControls } from '@src/features/profiles/presentation/components/ProfileEditControls';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import { VisitSummaryLink } from '@src/features/visitSummary/presentation/VisitSummaryLink';
import { formatDay, readingText } from '../../application/formatMeasurement';
import type { Measurement } from '../../application/ports';
import { ManualEntryLink } from './ManualEntryLink';
import { ProfileTabs, type ProfileTabKey } from './ProfileTabs';

type Props = {
  profile: HealthProfile;
  session: ProfileSession;
  /** undefined: không hiện dòng chỉ số (tab không tải số đo). */
  latest?: Measurement | null;
  active?: ProfileTabKey;
  /** Nút phụ bên phải thẻ, đứng trước nút chính "Nhập tay". */
  actions?: ReactNode;
};

// Đầu trang hồ sơ (Stitch 718c9615): thẻ hồ sơ có avatar, tên + tuổi, chỉ số mới nhất và nút hành động bên phải;
// hàng tab nằm ngoài thẻ. Nhập tay không kèm ảnh theo SPEC-011. Thẻ hẹp hơn 64rem (container query) thì xếp
// hàng nút xuống dưới tên để 4 nút không bị gãy dòng lẻ (E6-S1-T2 thêm "Tóm tắt đi khám").
export function ProfileHealthHeader({ profile, session, latest, active = 'health', actions }: Props) {
  const showsVitals = profileShowsVitals(profile);
  const age = profile.birthYear ? currentVietnamYear() - profile.birthYear : null;
  return (
    <div className="flex flex-col gap-4">
      <ProfileEditControls profile={profile} session={session} />
      <section className="@container rounded-xl bg-white p-5 shadow-sm lg:p-6">
        <div className="flex flex-col justify-between gap-4 @5xl:flex-row @5xl:items-center">
          <div className="flex min-w-0 items-center gap-4">
            <span className="relative shrink-0" aria-hidden="true">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#b3eddf] text-2xl font-semibold text-[#004135] shadow-sm">
                {profile.displayName.slice(0, 1)}
              </span>
              {profile.consentStatus === 'confirmed' && (
                <span className="absolute right-0 bottom-0 h-4 w-4 rounded-full bg-[#286958] ring-2 ring-white" />
              )}
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="auth-heading break-words text-2xl font-semibold tracking-tight text-[#131d1d] lg:text-[28px]">
                  {profile.displayName}
                </h1>
                {age !== null && (
                  <span className="rounded-full bg-[#e4f0f0] px-2.5 py-0.5 text-xs text-[#404945]">
                    {age} tuổi
                  </span>
                )}
              </div>
              {showsVitals && latest !== undefined && <LatestReading latest={latest} />}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start @5xl:shrink-0 @5xl:flex-nowrap @5xl:self-center">
            {actions}
            <VisitSummaryLink profileId={profile.id} />
            <ManualEntryLink profileId={profile.id} />
          </div>
        </div>
      </section>
      <ProfileTabs profileId={profile.id} active={active} showsVitals={showsVitals} />
    </div>
  );
}

function LatestReading({ latest }: { latest: Measurement | null }) {
  return (
    <p className="flex flex-wrap items-center gap-1 text-sm text-[#404945]">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="text-[#286958]"
      >
        <path d="M3 5h18v12H3Z M8 21h8 M6 11h3l2-3 2 6 2-3h3" />
      </svg>
      {latest ? (
        <>
          Chỉ số mới nhất: <strong className="tabular-nums text-[#131d1d]">{readingText(latest)}</strong> (
          {formatDay(latest.measuredOn)}
          {latest.measuredTime ? ` · ${latest.measuredTime}` : ''})
        </>
      ) : (
        'Chưa có số đo đã duyệt'
      )}
    </p>
  );
}
