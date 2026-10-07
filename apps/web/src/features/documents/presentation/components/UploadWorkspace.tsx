import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
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
  const navigate = useNavigate();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [declaredType, setDeclaredType] = useState<DocumentType | null>(null);
  const [tooMany, setTooMany] = useState(false);
  const { summary } = queue;
  const sending = summary.active > 0;
  useLeaveWarning(sending || summary.ready > 0);
  const ready = profiles.find((profile) => profile.id === profileId && profile.consentStatus === 'confirmed');
  // Gửi hết, không lỗi, không còn ảnh chưa gửi → sang Chờ duyệt kèm số ảnh đã gửi.
  const finished = summary.done > 0 && summary.total === summary.done;
  useEffect(() => {
    if (finished) void navigate({ to: '/review', state: { uploadedCount: summary.done } });
  }, [finished, navigate, summary.done]);
  return (
    <>
      <UploadIntro />
      <ProfileChoices
        profiles={profiles}
        {...status}
        profileId={ready?.id ?? null}
        locked={sending}
        onProfile={setProfileId}
        declaredType={declaredType}
        onType={setDeclaredType}
      />
      <UploadDropZone disabled={sending} onFiles={(files) => files.length && setTooMany(!queue.add(files))} />
      {tooMany && (
        <p role="alert" className="rounded-xl bg-[#ffdad6]/60 p-3 text-sm text-[#93000a]">
          Mỗi lần chỉ chọn tối đa {MAX_FILES_PER_PICK} ảnh. Không ảnh nào trong lần chọn vừa rồi được thêm.
        </p>
      )}
      <UploadGrid
        items={queue.items}
        summary={summary}
        locked={sending}
        onRetry={() => queue.dispatch({ type: 'retry' })}
        onRemove={queue.remove}
      />
      <RejectedFiles
        items={queue.items}
        validCount={summary.total}
        onDismiss={() => queue.dispatch({ type: 'dismissRejected' })}
      />
      <UploadActions
        summary={summary}
        profileChosen={Boolean(ready)}
        onSubmit={() => ready && queue.submit(ready.id, declaredType)}
      />
    </>
  );
}
