import { ProfileHealthHeader } from '@src/features/measurements/presentation/components/ProfileHealthHeader';
import { canManageProfileGuardians } from '../../application/canManageProfileGuardians';
import type { ProfileGuardiansRepository } from '../../application/guardianPorts';
import type { ProfileListItem, ProfileSession } from '../../application/ports';
import { ProfileGuardiansSection } from './ProfileGuardiansSection';

type Props = {
  profile: ProfileListItem;
  session: ProfileSession;
  repository?: ProfileGuardiansRepository;
};

// Nội dung tab "Người giám hộ" (E28-S3-T3): không chặn bởi cổng đồng ý vì người giám hộ là người đồng ý thay trẻ.
export function ProfileGuardiansPageContent({ profile, session, repository }: Props) {
  const eligible = canManageProfileGuardians(profile, session);
  return (
    <div className="flex flex-col gap-6">
      <ProfileHealthHeader profile={profile} session={session} active="guardians" />
      {eligible ? (
        <ProfileGuardiansSection
          profile={profile}
          session={session}
          {...(repository ? { repository } : {})}
        />
      ) : (
        <p role="alert" className="rounded-[20px] bg-surface p-6 text-sm">
          Hồ sơ này không cần người giám hộ.
        </p>
      )}
    </div>
  );
}
