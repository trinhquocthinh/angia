import { useNavigate } from '@tanstack/react-router';
import { useCurrentSession } from '@src/features/auth/application/useCurrentSession';
import { fetchCurrentSession } from '@src/features/auth/infrastructure/fetchCurrentSession';
import { useProfileSessionRecovery } from '../application/useProfileSessionRecovery';
import { useProfilesWorkspace } from '../application/useProfilesWorkspace';
import { createProfilesRepository } from '../infrastructure/createProfilesRepository';
import { HomePage } from './HomePage';
import { NewProfileDialog } from './components/NewProfileDialog';
const repository = createProfilesRepository();
// Giữ route /profiles/new để mọi liên kết và deep link vẫn chạy; hộp thoại nổi trên trang Gia đình.
export function NewProfilePage() {
  const session = useCurrentSession(fetchCurrentSession);
  const workspace = useProfilesWorkspace(repository, session.data, true);
  const navigate = useNavigate();
  useProfileSessionRecovery(workspace.accounts.error ?? workspace.create.error);
  const close = () => void navigate({ to: '/' });
  return (
    <>
      <HomePage />
      {session.data && (
        <NewProfileDialog
          session={session.data}
          accounts={workspace.accounts.data ?? []}
          accountsLoading={workspace.accounts.isPending}
          accountsError={workspace.accounts.isError}
          retry={() => void workspace.accounts.refetch()}
          pending={workspace.create.isPending}
          onSave={async (body) => {
            await workspace.create.mutateAsync(body);
            await navigate({ to: '/' });
          }}
          onClose={close}
        />
      )}
    </>
  );
}
