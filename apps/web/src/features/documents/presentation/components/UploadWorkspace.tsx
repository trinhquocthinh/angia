import type { useFamilyScanQuota } from '@src/features/scanQuota/application/useFamilyScanQuota';
import { useState } from 'react';
import type { FamilyUsage } from '@angia/contracts';
import type { HealthProfile } from '@src/features/profiles/application/ports';
import type { DocumentType, DocumentUploader, ImagePreparer } from '../../application/ports';
import { useLeaveWarning } from '../../application/useLeaveWarning';
import { useUploadQueue } from '../../application/useUploadQueue';
import { usageBlockReason } from '../../application/familyUsageState';
import { useOpenUploadedDocument } from '../../application/useOpenUploadedDocument';
import { UploadPickNotices } from './UploadPickNotices';
import { UploadUsageCards } from './UploadUsageCards';
import { ProfileChoices } from './ProfileChoices';
import { RejectedFiles } from './RejectedFiles';
import { UploadActions } from './UploadActions';
import { UploadDropZone } from './UploadDropZone';
import { UploadGrid } from './UploadGrid';
import { UploadIntro } from './UploadIntro';

type UploadWorkspaceProps = {
  uploader: DocumentUploader;
  prepare: ImagePreparer;
  csrfToken: string;
  profiles: HealthProfile[];
  usage: FamilyUsage | null;
  scanQuota: ReturnType<typeof useFamilyScanQuota>;
  loading: boolean;
  error: boolean;
  retry: () => void;
};

export function UploadWorkspace({
  uploader,
  prepare,
  csrfToken,
  profiles,
  usage,
  scanQuota,
  ...status
}: UploadWorkspaceProps) {
  const queue = useUploadQueue(uploader, prepare, csrfToken);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [declaredType, setDeclaredType] = useState<DocumentType | null>(null);
  const [tooMany, setTooMany] = useState(false);
  const { summary } = queue;
  const sending = summary.active > 0;
  // SPEC-030: chạm trần nào thì khóa chọn ảnh kèm lý do; máy chủ vẫn là nơi quyết định.
  const blocked = usage ? usageBlockReason(usage) : null;
  useLeaveWarning(sending || summary.ready > 0 || summary.preparing > 0);
  const ready = profiles.find((profile) => profile.id === profileId && profile.consentStatus === 'confirmed');
  useOpenUploadedDocument(summary);
  return (
    <>
      <UploadIntro />
      <UploadUsageCards usage={usage} scanQuota={scanQuota} />
      <ProfileChoices
        profiles={profiles}
        {...status}
        profileId={ready?.id ?? null}
        locked={sending}
        onProfile={setProfileId}
        declaredType={declaredType}
        onType={setDeclaredType}
      />
      <UploadDropZone
        disabled={sending || blocked !== null}
        blockedReason={sending ? null : blocked}
        onFiles={(files) => files.length && setTooMany(!queue.add(files))}
      />
      <UploadPickNotices tooMany={tooMany} usage={usage} readyCount={summary.ready} />
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
