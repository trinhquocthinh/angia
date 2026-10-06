import { useProfileSessionRecovery } from '../application/useProfileSessionRecovery';
import { Link, useNavigate } from '@tanstack/react-router';
import { useCurrentSession } from '@src/features/auth/application/useCurrentSession';
import { fetchCurrentSession } from '@src/features/auth/infrastructure/fetchCurrentSession';
import { useProfilesWorkspace } from '../application/useProfilesWorkspace';
import { createProfilesRepository } from '../infrastructure/createProfilesRepository';
import { ProfileFrame } from './components/ProfileFrame';
import { NewProfileForm } from './components/NewProfileForm';
import './profiles.css';
const repository = createProfilesRepository();
export function NewProfilePage() {
  const session = useCurrentSession(fetchCurrentSession);
  const workspace = useProfilesWorkspace(repository, session.data, true);
  const navigate = useNavigate();
  useProfileSessionRecovery(
    workspace.profiles.error ?? workspace.accounts.error ?? workspace.create.error ?? workspace.consent.error,
  );
  if (!session.data) return null;
  return (
    <ProfileFrame
      session={session.data}
      profiles={session.data.role === 'main' ? (workspace.profiles.data ?? []) : []}
      logout={workspace.logout}
    >
      <Link to="/" className="inline-flex min-h-11 items-center text-sm font-medium text-[#286958]">
        ← Về gia đình
      </Link>
      <h1 className="auth-heading mt-4 text-[32px] font-semibold text-[#004135]">Tạo hồ sơ mới</h1>
      <p className="mb-8 mt-3 text-sm leading-6 text-[#55615f]">Thêm người thân vào sổ sức khỏe gia đình.</p>
      {session.data.role === 'main' ? (
        <NewProfileForm
          accounts={workspace.accounts.data ?? []}
          accountsLoading={workspace.accounts.isPending}
          accountsError={workspace.accounts.isError}
          retry={() => void workspace.accounts.refetch()}
          pending={workspace.create.isPending}
          onSave={async (body) => {
            await workspace.create.mutateAsync(body);
            await navigate({ to: '/' });
          }}
        />
      ) : (
        <p role="alert">Chỉ người chăm sóc chính có thể tạo hồ sơ sức khỏe.</p>
      )}
    </ProfileFrame>
  );
}
