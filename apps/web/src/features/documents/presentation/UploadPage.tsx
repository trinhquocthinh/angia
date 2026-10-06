import { useCurrentSession } from '@src/features/auth/application/useCurrentSession';
import { fetchCurrentSession } from '@src/features/auth/infrastructure/fetchCurrentSession';
import { useProfilesWorkspace } from '@src/features/profiles/application/useProfilesWorkspace';
import { createProfilesRepository } from '@src/features/profiles/infrastructure/createProfilesRepository';
import { ProfileFrame } from '@src/features/profiles/presentation/components/ProfileFrame';
import { RecipientNotice } from '@src/features/profiles/presentation/components/RecipientNotice';
import '@src/features/profiles/presentation/profiles.css';
import { createXhrDocumentUploader } from '../infrastructure/createXhrDocumentUploader';
import { UploadWorkspace } from './components/UploadWorkspace';

const profilesRepository = createProfilesRepository();
const uploader = createXhrDocumentUploader();

export function UploadPage() {
  const session = useCurrentSession(fetchCurrentSession);
  const workspace = useProfilesWorkspace(profilesRepository, session.data);
  if (!session.data) return null;
  const main = session.data.role === 'main';
  const profiles = workspace.profiles.data ?? [];
  return (
    <ProfileFrame session={session.data} profiles={main ? profiles : []} logout={workspace.logout}>
      <div className="mx-auto flex w-full flex-col gap-6">
        {main ? (
          <UploadWorkspace
            uploader={uploader}
            csrfToken={session.data.csrfToken}
            profiles={profiles}
            loading={workspace.profiles.isPending}
            error={workspace.profiles.isError}
            retry={() => void workspace.profiles.refetch()}
          />
        ) : (
          <RecipientNotice />
        )}
      </div>
    </ProfileFrame>
  );
}
