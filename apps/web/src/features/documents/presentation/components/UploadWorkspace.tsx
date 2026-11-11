import type { useFamilyScanQuota } from '@src/features/scanQuota/application/useFamilyScanQuota';
import '@src/shared/ui/modal-motion.css';
import { useState } from 'react';
import type { FamilyUsage } from '@angia/contracts';
import type { HealthProfile } from '@src/features/profiles/application/ports';
import type { DocumentUploader } from '../../application/ports';
import type { RedactionSuggester } from '../../application/redactionSuggestionPorts';
import { useLeaveWarning } from '../../application/useLeaveWarning';
import { useUploadQueue } from '../../application/useUploadQueue';
import { aiQueueBlockReason, usageBlockReason } from '../../application/familyUsageState';
import { shouldWarnOnLeave, type UploadItem } from '../../application/uploadQueue';
import { useOpenUploadedDocument } from '../../application/useOpenUploadedDocument';
import { useUploadProfileChoice } from '../../application/useUploadProfileChoice';
import { UploadUsageCards } from './UploadUsageCards';
import { ProfileChoices } from './ProfileChoices';
import { UploadIntro } from './UploadIntro';
import { UploadQueuePanel } from './UploadQueuePanel';
import { UploadRedactionStudio } from './UploadRedactionStudio';
import './upload-motion.css';

type UploadWorkspaceProps = {
  uploader: DocumentUploader;
  /** SPEC-083: null khi API tắt gợi ý vùng che (`features.redactionSuggestions`). */
  suggester: RedactionSuggester | null;
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

// SPEC-083: tắt → không truyền. API kiểm đồng thuận theo hồ sơ: chưa có hồ sơ nhận ảnh thì `run` null
// và trình che cho chọn hồ sơ đã đồng thuận ngay tại nút.
const suggestProps = (
  suggester: RedactionSuggester | null,
  ready: HealthProfile | undefined,
  csrf: string,
  profiles: HealthProfile[],
  choose: (id: string) => void,
) =>
  suggester && {
    suggest: {
      run: ready
        ? (image: Blob, signal: AbortSignal) => suggester.suggest(ready.id, image, csrf, signal)
        : null,
      choices: profiles.filter((profile) => profile.consentStatus === 'confirmed'),
      onChooseProfile: choose,
    },
  };

// SPEC-084: ảnh nắn của mục đang che; đổi/bỏ ảnh nắn đi qua hàng đợi để thu hồi object URL đúng chỗ.
const scanProps = (queue: ReturnType<typeof useUploadQueue>, item: UploadItem) => ({
  scanned: Boolean(item.scan),
  onScanned: (blob: Blob) => queue.scan(item.id, blob),
  onUnscan: () => queue.unscan(item.id),
});

export function UploadWorkspace(props: UploadWorkspaceProps) {
  const { uploader, suggester, csrfToken, profiles, usage, scanQuota, ...status } = props;
  const queue = useUploadQueue(uploader, csrfToken);
  const { ready, chooseProfile, selectedType, setDeclaredType } = useUploadProfileChoice(profiles);
  const [editingId, setEditingId] = useState<string | null>(null);
  useLeaveWarning(shouldWarnOnLeave(queue.summary));
  useOpenUploadedDocument(queue.summary);
  const editing = queue.items.find((item) => item.id === editingId);
  return (
    <>
      <UploadIntro />
      <UploadUsageCards usage={usage} scanQuota={scanQuota} />
      <ProfileChoices
        profiles={profiles}
        {...status}
        profileId={ready?.id ?? null}
        locked={queue.summary.active > 0}
        onProfile={chooseProfile}
        declaredType={selectedType}
        onType={setDeclaredType}
      />
      {editing?.previewUrl ? (
        <UploadRedactionStudio
          // SPEC-084: đổi ảnh nắn thì dựng lại trình che với nguồn mới (vùng che đã được đặt lại).
          key={`${editing.id}:${editing.scan?.url ?? ''}`}
          item={{ ...editing, previewUrl: editing.previewUrl }}
          {...suggestProps(suggester, ready, csrfToken, profiles, chooseProfile)}
          scan={scanProps(queue, editing)}
          aiExhausted={usage?.aiOcr?.exhausted ?? false}
          aiReason={usage?.aiOcr?.reason}
          aiBlockedReason={usage ? aiQueueBlockReason(usage, queue.summary.aiReady) : null}
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
