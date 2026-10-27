import type { ProfileListItem, ProfilesRepository, ProfileSession } from '../../application/ports';
import { DeleteProfileDialog } from './DeleteProfileDialog';
import { ProfileConsentDialog } from './ProfileConsentDialog';
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
  profiles: ProfileListItem[];
  consent: ProfileListItem | null;
  deleting: ProfileListItem | null;
  closeConsent: () => void;
  closeDelete: () => void;
}) {
  const family = session.family;
  if (!family) return null;
  const currentConsent = profiles.find(
    (profile) => profile.id === consent?.id && profile.familyId === family.id,
  );
  const key = (profile: ProfileListItem) => `${session.account.id}:${family.id}:${profile.id}`;
  return (
    <>
      {currentConsent && (
        <ProfileConsentDialog
          key={key(currentConsent)}
          profile={currentConsent}
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
