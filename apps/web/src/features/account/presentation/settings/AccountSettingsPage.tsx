import { useQueryClient } from '@tanstack/react-query';
import {
  ENROLL_LATER_KEY,
  ENROLL_REAUTH_KEY,
  PASSWORD_RESET_BY_KEY,
  RESTRICTED_CSRF_KEY,
  writeAccountStorage,
} from '@src/features/account/application/accountSessionStorage';
import { AccountSettingsView } from '@src/features/account/presentation/settings/AccountSettingsView';
import { CURRENT_SESSION_KEY, useCurrentSession } from '@src/features/auth/application/useCurrentSession';
import { fetchCurrentSession } from '@src/features/auth/infrastructure/fetchCurrentSession';
import { useProfilesWorkspace } from '@src/features/profiles/application/useProfilesWorkspace';
import { createProfilesRepository } from '@src/features/profiles/infrastructure/createProfilesRepository';
import { ProfileFrame } from '@src/features/profiles/presentation/components/ProfileFrame';

const profilesRepository = createProfilesRepository();

export function AccountSettingsPage() {
  const client = useQueryClient();
  const session = useCurrentSession(fetchCurrentSession);
  const workspace = useProfilesWorkspace(profilesRepository, session.data);
  if (!session.data) return null;
  const main = session.data.role === 'main';
  const profiles = main ? (workspace.profiles.data ?? []) : [];
  return (
    <ProfileFrame
      session={session.data}
      profiles={profiles}
      logout={workspace.logout}
      mobileTitle="Tài khoản"
    >
      <AccountSettingsView
        session={session.data}
        profiles={profiles}
        onRefreshSession={async () => {
          await client.invalidateQueries({ queryKey: CURRENT_SESSION_KEY });
        }}
        onAccountDeleted={async () => {
          writeAccountStorage(RESTRICTED_CSRF_KEY, null);
          writeAccountStorage(PASSWORD_RESET_BY_KEY, null);
          writeAccountStorage(ENROLL_LATER_KEY, null);
          writeAccountStorage(ENROLL_REAUTH_KEY, null);
          await client.cancelQueries();
          client.clear();
          window.location.assign('/login');
        }}
      />
    </ProfileFrame>
  );
}
