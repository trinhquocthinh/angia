import type { ReactNode } from 'react';
import { useCurrentSession } from '@src/features/auth/application/useCurrentSession';
import { fetchCurrentSession } from '@src/features/auth/infrastructure/fetchCurrentSession';
import type { HealthProfile, ProfileSession } from '../../application/ports';
import { useProfileSessionRecovery } from '../../application/useProfileSessionRecovery';
import { useProfilesWorkspace } from '../../application/useProfilesWorkspace';
import { createProfilesRepository } from '../../infrastructure/createProfilesRepository';
import { ProfileFrame } from './ProfileFrame';
import { RecipientNotice } from './RecipientNotice';
import '../profiles.css';

const profilesRepository = createProfilesRepository();

type Props = {
  profileId: string;
  children: (profile: HealthProfile, session: ProfileSession) => ReactNode;
};

// Khung chung của các tab hồ sơ: chỉ chính chủ gia đình xem; hồ sơ không thuộc gia đình → báo không tìm thấy.
export function ProfileSectionPage({ profileId, children }: Props) {
  const session = useCurrentSession(fetchCurrentSession);
  const workspace = useProfilesWorkspace(profilesRepository, session.data);
  const profiles = workspace.profiles.data ?? [];
  const profile = profiles.find((item) => item.id === profileId);
  useProfileSessionRecovery(workspace.profiles.error);
  if (!session.data) return null;
  const main = session.data.role === 'main';
  return (
    <ProfileFrame session={session.data} profiles={main ? profiles : []} logout={workspace.logout}>
      {!main ? (
        <RecipientNotice />
      ) : workspace.profiles.isSuccess && !profile ? (
        <p role="alert" className="rounded-[20px] bg-white p-6 text-sm">
          Không tìm thấy hồ sơ này trong gia đình.
        </p>
      ) : (
        profile && children(profile, session.data)
      )}
    </ProfileFrame>
  );
}
