import { Navigate } from '@tanstack/react-router';
import { profileShowsVitals } from '@src/features/profiles/application/profileShowsVitals';
import { useCurrentSession } from '@src/features/auth/application/useCurrentSession';
import { fetchCurrentSession } from '@src/features/auth/infrastructure/fetchCurrentSession';
import { useProfileSessionRecovery } from '@src/features/profiles/application/useProfileSessionRecovery';
import { useProfilesWorkspace } from '@src/features/profiles/application/useProfilesWorkspace';
import { createProfilesRepository } from '@src/features/profiles/infrastructure/createProfilesRepository';
import { ProfileFrame } from '@src/features/profiles/presentation/components/ProfileFrame';
import { RecipientNotice } from '@src/features/profiles/presentation/components/RecipientNotice';
import '@src/features/profiles/presentation/profiles.css';
import { ProfileHealthContent } from './components/ProfileHealthContent';

const profilesRepository = createProfilesRepository();

// Chặn hiển thị theo tuổi trước khi khởi tạo các truy vấn số đo (BR-049).
export function ProfileHealthPage({ profileId }: { profileId: string }) {
  const session = useCurrentSession(fetchCurrentSession);
  const workspace = useProfilesWorkspace(profilesRepository, session.data);
  const profiles = workspace.profiles.data ?? [];
  const profile = profiles.find((item) => item.id === profileId);
  useProfileSessionRecovery(workspace.profiles.error);
  if (!session.data) return null;
  const main = session.data.role === 'main';
  if (main && profile && !profileShowsVitals(profile))
    return <Navigate to="/profiles/$profileId/medications" params={{ profileId }} replace />;
  return (
    <ProfileFrame session={session.data} profiles={main ? profiles : []} logout={workspace.logout}>
      {!main ? (
        <RecipientNotice />
      ) : workspace.profiles.isSuccess && !profile ? (
        <p role="alert" className="rounded-[20px] bg-white p-6 text-sm">
          Không tìm thấy hồ sơ này trong gia đình.
        </p>
      ) : (
        profile && <ProfileHealthContent key={profile.id} profile={profile} session={session.data} />
      )}
    </ProfileFrame>
  );
}
