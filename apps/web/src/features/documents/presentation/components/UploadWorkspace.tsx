import type { useFamilyScanQuota } from '@src/features/scanQuota/application/useFamilyScanQuota';
import '@src/shared/ui/modal-motion.css';
import { useState } from 'react';
import { profileShowsVitals } from '@src/features/profiles/application/profileShowsVitals';
import type { FamilyUsage } from '@angia/contracts';
import type { HealthProfile } from '@src/features/profiles/application/ports';
import type { DocumentType, DocumentUploader } from '../../application/ports';
import { useLeaveWarning } from '../../application/useLeaveWarning';
import { useUploadQueue } from '../../application/useUploadQueue';
import { aiQueueBlockReason, usageBlockReason } from '../../application/familyUsageState';
import { shouldWarnOnLeave, type UploadItem } from '../../application/uploadQueue';
import { useOpenUploadedDocument } from '../../application/useOpenUploadedDocument';
import { UploadUsageCards } from './UploadUsageCards';
import { ProfileChoices } from './ProfileChoices';
import { UploadIntro } from './UploadIntro';
import { UploadQueuePanel } from './UploadQueuePanel';
import { UploadRedactionStudio } from './UploadRedactionStudio';
import './upload-motion.css';

type UploadWorkspaceProps = {
  uploader: DocumentUploader;
  csrfToken: string;
  profiles: HealthProfile[];
  usage: FamilyUsage | null;
  scanQuota: ReturnType<typeof useFamilyScanQuota>;
  loading: boolean;
  error: boolean;
  retry: () => void;
};

// Che xong một ảnh thì mở tiếp ảnh chưa che kế tiếp (KH-2 §3 bước 2: lần lượt từng ảnh).
const nextToRedact = (items: UploadItem[], doneId: string) =>
  items.find((item) => item.id !== doneId && item.status === 'needs_redaction')?.id ?? null;

export function UploadWorkspace(props: UploadWorkspaceProps) {
  const { uploader, csrfToken, profiles, usage, scanQuota, ...status } = props;
  const queue = useUploadQueue(uploader, csrfToken);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [declaredType, setDeclaredType] = useState<DocumentType | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { summary } = queue;
  useLeaveWarning(shouldWarnOnLeave(summary));
  const ready = profiles.find((profile) => profile.id === profileId && profile.consentStatus === 'confirmed');
  const selectedType =
    ready && !profileShowsVitals(ready) && declaredType === 'device_reading' ? null : declaredType;
  useOpenUploadedDocument(summary);
  const editing = queue.items.find((item) => item.id === editingId);
  return (
    <>
      <UploadIntro />
      <UploadUsageCards usage={usage} scanQuota={scanQuota} />
      <ProfileChoices
        profiles={profiles}
        {...status}
        profileId={ready?.id ?? null}
        locked={summary.active > 0}
        onProfile={(id) => {
          setProfileId(id);
          const next = profiles.find((profile) => profile.id === id);
          if (next && !profileShowsVitals(next) && declaredType === 'device_reading') setDeclaredType(null);
        }}
        declaredType={selectedType}
        onType={setDeclaredType}
      />
      {editing?.previewUrl ? (
        <UploadRedactionStudio
          key={editing.id}
          item={{ ...editing, previewUrl: editing.previewUrl }}
          aiExhausted={usage?.aiOcr?.exhausted ?? false}
          aiReason={usage?.aiOcr?.reason}
          aiBlockedReason={usage ? aiQueueBlockReason(usage, summary.aiReady) : null}
          onDone={(blob, edits, sendToAi) => {
            queue.redact(editing.id, blob, edits, sendToAi);
            setEditingId(nextToRedact(queue.items, editing.id));
          }}
          onClose={() => setEditingId(null)}
        />
      ) : (
        <UploadQueuePanel
          queue={queue}
          usage={usage}
          // SPEC-030: chạm trần nào thì khóa chọn ảnh kèm lý do; máy chủ vẫn là nơi quyết định.
          blocked={usage ? usageBlockReason(usage) : null}
          profileChosen={Boolean(ready)}
          onSubmit={() => ready && queue.submit(ready.id, selectedType)}
          onRedact={(id) => {
            queue.dispatch({ type: 'reopen', id });
            setEditingId(id);
          }}
        />
      )}
    </>
  );
}
