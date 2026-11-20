import { ProfileSectionPage } from '@src/features/profiles/presentation/components/ProfileSectionPage';
import { ReminderSettings } from './ReminderSettings';

// Trang /profiles/:id/reminders — khung giờ buổi (E9-S1-T1, SPEC-025) và người nhận nhắc (SPEC-026).
export function DoseSlotsPage({ profileId }: { profileId: string }) {
  return (
    <ProfileSectionPage profileId={profileId}>
      {(profile, session) => (
        <ReminderSettings
          key={`${session.account.id}:${session.family?.id}:${profile.id}`}
          profile={profile}
          session={session}
        />
      )}
    </ProfileSectionPage>
  );
}
