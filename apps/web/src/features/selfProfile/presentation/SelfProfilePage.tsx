import { useCurrentSession } from '@src/features/auth/application/useCurrentSession';
import { fetchCurrentSession } from '@src/features/auth/infrastructure/fetchCurrentSession';
import { useProfilesWorkspace } from '@src/features/profiles/application/useProfilesWorkspace';
import { createProfilesRepository } from '@src/features/profiles/infrastructure/createProfilesRepository';
import { ProfileFrame } from '@src/features/profiles/presentation/components/ProfileFrame';
import '@src/features/profiles/presentation/profiles.css';
import type { SelfSectionKey } from '../application/selfSections';
import { SelfProfileContent } from './SelfProfileContent';

const profilesRepository = createProfilesRepository();

// Route /my-profile (SPEC-042): main đã liên kết giữ điều hướng gia đình, member dùng khung cá nhân.
export function SelfProfilePage({ section }: { section: SelfSectionKey | undefined }) {
  const session = useCurrentSession(fetchCurrentSession);
  const workspace = useProfilesWorkspace(profilesRepository, session.data);
  if (!session.data) return null;
  return (
    <ProfileFrame session={session.data} profiles={workspace.profiles.data ?? []} logout={workspace.logout}>
      <SelfProfileContent session={session.data} section={section} />
    </ProfileFrame>
  );
}
