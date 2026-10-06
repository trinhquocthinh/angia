import { useState } from 'react';
import type { HealthProfile } from '@src/features/profiles/application/ports';
import type { DocumentType, DocumentUploader } from '../../application/ports';
import { MAX_FILES_PER_PICK } from '../../application/uploadQueue';
import { useLeaveWarning } from '../../application/useLeaveWarning';
import { useUploadQueue } from '../../application/useUploadQueue';
import { ProfileChoices } from './ProfileChoices';
import { RejectedFiles } from './RejectedFiles';
import { UploadActions } from './UploadActions';
import { UploadDropZone } from './UploadDropZone';
import { UploadGrid } from './UploadGrid';
import { UploadIntro } from './UploadIntro';

type UploadWorkspaceProps = {
  uploader: DocumentUploader;
  csrfToken: string;
  profiles: HealthProfile[];
  loading: boolean;
  error: boolean;
  retry: () => void;
};

export function UploadWorkspace({ uploader, csrfToken, profiles, ...status }: UploadWorkspaceProps) {
  const queue = useUploadQueue(uploader, csrfToken);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [declaredType, setDeclaredType] = useState<DocumentType | null>(null);
  const [tooMany, setTooMany] = useState(false);
  const busy = queue.summary.active > 0;
  useLeaveWarning(busy);
  const ready = profiles.find((profile) => profile.id === profileId && profile.consentStatus === 'confirmed');
  const addFiles = (files: File[]) => {
    if (!ready || files.length === 0) return;
    setTooMany(!queue.add(files, ready.id, declaredType));
  };
  return (
    <>
      <UploadIntro />
      <ProfileChoices
        profiles={profiles}
        {...status}
        profileId={ready?.id ?? null}
        locked={busy}
        onProfile={setProfileId}
        declaredType={declaredType}
        onType={setDeclaredType}
      />
      <UploadDropZone disabled={!ready} onFiles={addFiles} />
      {tooMany && (
        <p role="alert" className="rounded-xl bg-[#ffdad6]/60 p-3 text-sm text-[#93000a]">
          Mỗi lần chỉ chọn tối đa {MAX_FILES_PER_PICK} ảnh. Không ảnh nào trong lần chọn vừa rồi được gửi.
        </p>
      )}
      <UploadGrid
        items={queue.items}
        summary={queue.summary}
        onRetry={() => queue.dispatch({ type: 'retry' })}
        onRemove={(id) => queue.dispatch({ type: 'remove', id })}
      />
      <RejectedFiles
        items={queue.items}
        validCount={queue.summary.total}
        onDismiss={() => queue.dispatch({ type: 'dismissRejected' })}
      />
      <UploadActions uploading={busy} />
    </>
  );
}
