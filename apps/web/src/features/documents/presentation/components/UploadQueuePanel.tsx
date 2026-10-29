import type { FamilyUsage } from '@angia/contracts';
import { useState } from 'react';
import type { useUploadQueue } from '../../application/useUploadQueue';
import { RejectedFiles } from './RejectedFiles';
import { UploadActions } from './UploadActions';
import { UploadDropZone } from './UploadDropZone';
import { UploadGrid } from './UploadGrid';
import { UploadPickNotices } from './UploadPickNotices';

type Props = {
  queue: ReturnType<typeof useUploadQueue>;
  usage: FamilyUsage | null;
  /** SPEC-030: lý do khóa chọn ảnh (dung lượng, ảnh/ngày). */
  blocked: string | null;
  profileChosen: boolean;
  onSubmit: () => void;
  onRedact: (id: string) => void;
};

// Chọn ảnh, lưới ảnh đã chọn và nút gửi; ẩn đi khi đang che một ảnh.
export function UploadQueuePanel({ queue, usage, blocked, profileChosen, onSubmit, onRedact }: Props) {
  const [tooMany, setTooMany] = useState(false);
  const { summary } = queue;
  const sending = summary.active > 0;
  return (
    <>
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
        onRedact={onRedact}
      />
      <RejectedFiles
        items={queue.items}
        validCount={summary.total}
        onDismiss={() => queue.dispatch({ type: 'dismissRejected' })}
      />
      <UploadActions summary={summary} profileChosen={profileChosen} onSubmit={onSubmit} />
    </>
  );
}
