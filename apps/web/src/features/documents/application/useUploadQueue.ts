import type { PrivacyEdits } from '@angia/contracts';
import { useCallback, useEffect, useReducer, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { DocumentType, DocumentUploader } from './ports';
import { runUpload } from './runUpload';
import { FAMILY_USAGE_KEY } from './useFamilyUsage';
import { useObjectUrls } from './useObjectUrls';
import { isSessionError } from './uploadErrorMessage';
import { nextBatch, planUpload, summarizeQueue, uploadQueueReducer } from './uploadQueue';

// Ảnh chỉ gửi sau khi đã che hết và bấm "Xong", theo lô ≤ 10 ảnh/request.
// Không hủy request khi unmount: StrictMode giả lập unmount sẽ làm ảnh kẹt "đang tải".
export function useUploadQueue(uploader: DocumentUploader, csrfToken: string | undefined) {
  const client = useQueryClient();
  const [items, dispatch] = useReducer(uploadQueueReducer, []);
  const started = useRef(new Set<string>());
  // Khóa URL: ảnh gốc để che (`id`) và bản đã xuất (`id:thumb`).
  const { create, revoke } = useObjectUrls();

  // StrictMode chạy effect hai lần trước khi state kịp áp dụng: khóa theo id:lượt.
  useEffect(() => {
    const batch = csrfToken ? nextBatch(items) : [];
    const key = batch.map((item) => `${item.id}:${item.attempt}`).join(',');
    if (!csrfToken || !key || started.current.has(key)) return;
    started.current.add(key);
    void runUpload(batch, uploader, csrfToken, dispatch).then((error) => {
      // SPEC-030: lô xong hay lỗi đều đổi mức dùng của gia đình.
      void client.invalidateQueries({ queryKey: FAMILY_USAGE_KEY });
      if (isSessionError(error)) void client.invalidateQueries({ queryKey: ['current-session'] });
    });
  }, [items, csrfToken, uploader, client]);

  // KH-2 §3.6: ảnh gốc chỉ giữ trong tab tới khi đã tải lên.
  useEffect(() => {
    for (const item of items) if (item.status === 'done') revoke(item.id);
  }, [items, revoke]);

  const add = useCallback(
    (files: File[]) => {
      const planned = planUpload(files, () => crypto.randomUUID());
      if (!planned.ok) return false;
      const withPreview = planned.items.map((item) =>
        item.status === 'rejected' ? item : { ...item, previewUrl: create(item.id, item.file) },
      );
      dispatch({ type: 'add', items: withPreview });
      return true;
    },
    [create],
  );
  const redact = useCallback(
    (id: string, blob: Blob, edits: PrivacyEdits, sendToAi: boolean) => {
      const upload = new File([blob], `${id}.jpg`, { type: 'image/jpeg' });
      const thumbnailUrl = create(`${id}:thumb`, upload);
      dispatch({ type: 'redacted', id, upload, edits, sendToAi, thumbnailUrl });
    },
    [create],
  );
  const submit = useCallback((profileId: string, declaredType: DocumentType | null) => {
    dispatch({ type: 'submit', profileId, declaredType });
  }, []);
  const remove = useCallback(
    (id: string) => {
      revoke(id);
      revoke(`${id}:thumb`);
      dispatch({ type: 'remove', id });
    },
    [revoke],
  );
  return { items, summary: summarizeQueue(items), add, redact, submit, remove, dispatch };
}
