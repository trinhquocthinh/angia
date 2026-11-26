import type { ReactNode } from 'react';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import { ProfileSectionIcon } from '@src/features/profiles/presentation/components/ProfileSectionIcon';
import '@src/features/profiles/presentation/profiles.css';
import { canManageProfileGuardians } from '@src/features/profiles/application/canManageProfileGuardians';
import { profileShowsVitals } from '@src/features/profiles/application/profileShowsVitals';
import { currentVietnamYear } from '@src/features/profiles/application/currentVietnamYear';
import { ProfileEditControls } from '@src/features/profiles/presentation/components/ProfileEditControls';
import type { ProfileListItem, ProfileSession } from '@src/features/profiles/application/ports';
import { VisitSummaryLink } from '@src/features/visitSummary/presentation/VisitSummaryLink';
import { formatDay, readingText } from '../../application/formatMeasurement';
import type { Measurement } from '../../application/ports';
import { ManualEntryLink } from './ManualEntryLink';
import { ProfileTabs, type ProfileTabKey } from './ProfileTabs';

type Props = {
  profile: ProfileListItem;
  session: ProfileSession;
  latest?: Measurement | null;
  active?: ProfileTabKey;
  actions?: ReactNode;
};

// Đầu trang các mục con hồ sơ theo chuẩn 3D Bento v2.0 (Stitch c5e09b60).
export function ProfileHealthHeader({ profile, session, latest, active = 'health', actions }: Props) {
  const showsVitals = profileShowsVitals(profile);
  const showsGuardians = canManageProfileGuardians(profile, session);
  const age = profile.birthYear ? currentVietnamYear() - profile.birthYear : null;
  const confirmed = profile.consentStatus === 'confirmed';
  return (
    <div className="flex flex-col gap-4">
      <section className="@container profile-bento-card p-5 lg:p-6">
        <div className="flex flex-col justify-between gap-4 @5xl:flex-row @5xl:items-center">
          <div className="flex min-w-0 items-center gap-4">
            <span className="profile-ceramic-avatar profile-ceramic-avatar-lg" aria-hidden="true">
              {profile.displayName.slice(0, 1)}
              {confirmed && (
                <span className="profile-ceramic-badge">
                  <AdminIcon name="verified_user" size={15} />
                </span>
              )}
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="auth-heading break-words text-heading-1 font-semibold tracking-tight text-text-primary">
                  {profile.displayName}
                </h1>
                {age !== null && (
                  <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-caption font-semibold text-accent">
                    {age} tuổi
                  </span>
                )}
              </div>
              {showsVitals && latest !== undefined && <LatestReading latest={latest} />}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start @5xl:shrink-0 @5xl:flex-nowrap @5xl:self-center">
            <ProfileEditControls profile={profile} session={session} />
            {actions}
            <VisitSummaryLink profileId={profile.id} />
            <ManualEntryLink profileId={profile.id} />
          </div>
        </div>
      </section>
      <ProfileTabs
        profileId={profile.id}
        active={active}
        showsVitals={showsVitals}
        showsGuardians={showsGuardians}
      />
    </div>
  );
}

function LatestReading({ latest }: { latest: Measurement | null }) {
  return (
    <p className="flex flex-wrap items-center gap-1.5 text-caption text-text-secondary">
      <ProfileSectionIcon name="monitor_heart" size={18} />
      {latest ? (
        <>
          <strong className="tabular-nums text-text-primary">{readingText(latest)}</strong> ·{' '}
          {formatDay(latest.measuredOn)}
          {latest.measuredTime ? ` ${latest.measuredTime}` : ''}
        </>
      ) : (
        'Chưa có số đo đã duyệt'
      )}
    </p>
  );
}
