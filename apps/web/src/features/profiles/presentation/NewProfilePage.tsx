import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useCurrentSession } from '@src/features/auth/application/useCurrentSession';
import { fetchCurrentSession } from '@src/features/auth/infrastructure/fetchCurrentSession';
import type { InvitationCreated } from '../application/invitationPorts';
import { useProfileSessionRecovery } from '../application/useProfileSessionRecovery';
import { useProfilesWorkspace } from '../application/useProfilesWorkspace';
import { createProfilesRepository } from '../infrastructure/createProfilesRepository';
import { HomePage } from './HomePage';
import { CreatedLinkDialog } from './components/CreatedLinkDialog';
import { NewProfileDialog } from './components/NewProfileDialog';
const repository = createProfilesRepository();
// Giữ route /profiles/new để mọi liên kết và deep link vẫn chạy; hộp thoại nổi trên trang Gia đình.
export function NewProfilePage() {
  const session = useCurrentSession(fetchCurrentSession);
  const workspace = useProfilesWorkspace(repository, session.data, true);
  const navigate = useNavigate();
  const [link, setLink] = useState<InvitationCreated | null>(null);
  useProfileSessionRecovery(workspace.accounts.error ?? workspace.create.error);
  const close = () => void navigate({ to: '/' });
  return (
    <>
      <HomePage />
      {link && <CreatedLinkDialog created={link} onClose={close} />}
      {session.data && !link && (
        <NewProfileDialog
          session={session.data}
          accounts={workspace.accounts.data ?? []}
          accountsLoading={workspace.accounts.isPending}
          accountsError={workspace.accounts.isError}
          retry={() => void workspace.accounts.refetch()}
          pending={workspace.create.isPending}
          onSave={async (body) => {
            const created = await workspace.create.mutateAsync(body);
            workspace.create.reset();
            // SPEC-004: link chỉ trả một lần lúc tạo nên phải hiện ngay trước khi rời hộp thoại.
            if (created.linkInvitation) setLink(created.linkInvitation);
            else await navigate({ to: '/' });
          }}
          onClose={close}
        />
      )}
    </>
  );
}
