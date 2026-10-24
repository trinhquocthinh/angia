import type { HealthProfile, ProfilesRepository, ProfileSession } from '../../application/ports';
import { DeleteProfileDialog } from './DeleteProfileDialog';
import { InvitationManagerDialog } from './InvitationManagerDialog';
// Dialog chỉ mở cho hồ sơ thuộc gia đình của phiên hiện tại; key theo phiên để đổi tài khoản là dựng lại.
export function ProfileDialogs({
  session,
  repository,
  profiles,
  consent,
  deleting,
  closeConsent,
  closeDelete,
}: {
  session: ProfileSession;
  repository: ProfilesRepository;
  profiles: HealthProfile[];
  consent: HealthProfile | null;
  deleting: HealthProfile | null;
  closeConsent: () => void;
  closeDelete: () => void;
}) {
  const family = session.family;
  if (!family) return null;
  const key = (profile: HealthProfile) => `${session.account.id}:${family.id}:${profile.id}`;
  return (
    <>
      {consent && consent.familyId === family.id && (
        <InvitationManagerDialog
          key={key(consent)}
          profile={profiles.find((profile) => profile.id === consent.id) ?? consent}
          session={session}
          repository={repository}
          onClose={closeConsent}
        />
      )}
      {deleting && deleting.familyId === family.id && (
        <DeleteProfileDialog
          key={key(deleting)}
          profile={deleting}
          session={session}
          repository={repository}
          onClose={closeDelete}
        />
      )}
    </>
  );
}
