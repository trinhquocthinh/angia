import { ProfileSectionPage } from '../components/ProfileSectionPage';
import { ProfileGuardiansPageContent } from './ProfileGuardiansPageContent';

// Trang /profiles/:id/guardians — tab Người giám hộ của hồ sơ vị thành niên chưa liên kết (E28-S3-T3, SPEC-070).
export function ProfileGuardiansPage({ profileId }: { profileId: string }) {
  return (
    <ProfileSectionPage profileId={profileId}>
      {(profile, session) => (
        <ProfileGuardiansPageContent
          key={`${session.account.id}:${session.family?.id}:${profile.id}`}
          profile={profile}
          session={session}
        />
      )}
    </ProfileSectionPage>
  );
}
