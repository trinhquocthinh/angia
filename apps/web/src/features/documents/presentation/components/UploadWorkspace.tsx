import type { useFamilyScanQuota } from '@src/features/scanQuota/application/useFamilyScanQuota';
import '@src/shared/ui/modal-motion.css';
import { useState } from 'react';
import type { FamilyUsage } from '@angia/contracts';
import type { HealthProfile } from '@src/features/profiles/application/ports';
import type { DocumentUploader } from '../../application/ports';
import { useLeaveWarning } from '../../application/useLeaveWarning';
import { useUploadChoices } from '../../application/useUploadChoices';
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
  const choices = useUploadChoices(profiles);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { summary } = queue;
  useLeaveWarning(shouldWarnOnLeave(summary));
  const { ready, selectedType } = choices;
  useOpenUploadedDocument(summary);
  const editing = queue.items.find((item) => item.id === editingId);
  // Mức sử dụng là thông tin phụ nên nằm cuối trang; chạm trần thì đưa lên đầu vì nó quyết định có tải được không.
  const limited = usage && (usageBlockReason(usage) ?? aiQueueBlockReason(usage, 0));
  const usageCards = <UploadUsageCards usage={usage} scanQuota={scanQuota} />;
  return (
    <>
      <UploadIntro />
      {limited && usageCards}
      <ProfileChoices
        profiles={profiles}
        {...status}
        profileId={ready?.id ?? null}
        locked={summary.active > 0}
        onProfile={choices.selectProfile}
        declaredType={selectedType}
        onType={choices.setDeclaredType}
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
      {!limited && usageCards}
    </>
  );
}
