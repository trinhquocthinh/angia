import { Link } from '@tanstack/react-router';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import { VisitSummaryLink } from '@src/features/visitSummary/presentation/VisitSummaryLink';
import type { ProfileListItem, ProfileSession } from '../../application/ports';
import { ProfileConsentStatus } from './ProfileConsentStatus';
import { ProfileDeleteSection } from './ProfileDeleteSection';
import { ProfileDirectory } from './ProfileDirectory';
import { ProfileEditControls } from './ProfileEditControls';
import { ProfileIdentityHero } from './ProfileIdentityHero';

export function ProfileOverview({ profile, session }: { profile: ProfileListItem; session: ProfileSession }) {
  return (
    <div className="profile-overview mx-auto flex max-w-4xl flex-col gap-5">
      <Link
        to="/"
        search={{ view: 'profiles' }}
        className="inline-flex min-h-12 items-center gap-1.5 self-start rounded-full px-3 text-body font-semibold text-secondary transition-colors hover:bg-surface-container hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <AdminIcon name="arrow_back" size={20} />
        Hồ sơ
      </Link>
      <ProfileIdentityHero
        title={profile.displayName}
        displayName={profile.displayName}
        birthYear={profile.birthYear}
        consentStatus={profile.consentStatus}
        actions={
          <>
            <ProfileEditControls profile={profile} session={session} />
            <VisitSummaryLink profileId={profile.id} />
          </>
        }
        footer={
          profile.consentStatus !== 'confirmed' ? <ProfileConsentStatus profile={profile} /> : undefined
        }
      />
      <ProfileDirectory profile={profile} session={session} />
      <ProfileDeleteSection profile={profile} session={session} />
    </div>
  );
}
