import { useCurrentSession } from '@src/features/auth/application/useCurrentSession';
import { fetchCurrentSession } from '@src/features/auth/infrastructure/fetchCurrentSession';
import { useProfilesWorkspace } from '@src/features/profiles/application/useProfilesWorkspace';
import { createProfilesRepository } from '@src/features/profiles/infrastructure/createProfilesRepository';
import { ProfileFrame } from '@src/features/profiles/presentation/components/ProfileFrame';
import { PushSettingsPanel } from './PushSettingsPanel';
const profilesRepository = createProfilesRepository();
export function PushSettingsPage() {
  const session = useCurrentSession(fetchCurrentSession);
  const workspace = useProfilesWorkspace(profilesRepository, session.data);
  if (!session.data) return null;
  const main = session.data.role === 'main';
  return (
    <ProfileFrame
      session={session.data}
      profiles={main ? (workspace.profiles.data ?? []) : []}
      logout={workspace.logout}
      mobileTitle="Thông báo thiết bị"
    >
      {session.data.family ? (
        <PushSettingsPanel key={session.data.csrfToken} csrf={session.data.csrfToken} />
      ) : (
        <p role="alert" className="rounded-[20px] bg-white p-6 text-sm">
          Tài khoản cần được gán vào gia đình trước khi bật thông báo.
        </p>
      )}
    </ProfileFrame>
  );
}
