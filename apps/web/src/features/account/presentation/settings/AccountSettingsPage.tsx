import { useQueryClient } from '@tanstack/react-query';
import { CURRENT_SESSION_KEY, useCurrentSession } from '@src/features/auth/application/useCurrentSession';
import { fetchCurrentSession } from '@src/features/auth/infrastructure/fetchCurrentSession';
import { useProfilesWorkspace } from '@src/features/profiles/application/useProfilesWorkspace';
import { createProfilesRepository } from '@src/features/profiles/infrastructure/createProfilesRepository';
import { ProfileFrame } from '@src/features/profiles/presentation/components/ProfileFrame';
import { AccountSettingsView } from '@src/features/account/presentation/settings/AccountSettingsView';

const profilesRepository = createProfilesRepository();

export function AccountSettingsPage() {
  const client = useQueryClient();
  const session = useCurrentSession(fetchCurrentSession);
  const workspace = useProfilesWorkspace(profilesRepository, session.data);
  if (!session.data) return null;
  const main = session.data.role === 'main';
  return (
    <ProfileFrame
      session={session.data}
      profiles={main ? (workspace.profiles.data ?? []) : []}
      logout={workspace.logout}
      mobileTitle="Tài khoản"
    >
      <AccountSettingsView
        session={session.data}
        onRefreshSession={async () => {
          await client.invalidateQueries({ queryKey: CURRENT_SESSION_KEY });
        }}
      />
    </ProfileFrame>
  );
}
