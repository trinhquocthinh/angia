import { useCallback, useEffect, useReducer, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { DocumentType, DocumentUploader } from './ports';
import { runUpload } from './runUpload';
import { isSessionError } from './uploadErrorMessage';
import { nextQueued, planUpload, summarizeQueue, uploadQueueReducer } from './uploadQueue';

const PREVIEWABLE = /^image\/(jpeg|png|webp)$/;

// Gửi tuần tự từng ảnh. Không hủy request khi unmount: StrictMode giả lập unmount sẽ làm ảnh kẹt
// "đang tải"; rời trang giữa chừng thì ảnh đang gửi vẫn hoàn tất, các ảnh còn chờ không được gửi.
export function useUploadQueue(uploader: DocumentUploader, csrfToken: string | undefined) {
  const client = useQueryClient();
  const [items, dispatch] = useReducer(uploadQueueReducer, []);
  const started = useRef(new Set<string>());
  const previews = useRef<string[]>([]);
  const next = csrfToken ? nextQueued(items) : undefined;

  useEffect(() => {
    if (!next || !csrfToken) return;
    const key = `${next.id}:${next.attempt}`;
    // StrictMode chạy effect hai lần trước khi state 'uploading' kịp áp dụng.
    if (started.current.has(key)) return;
    started.current.add(key);
    void runUpload(next, uploader, csrfToken, dispatch).then((error) => {
      if (isSessionError(error)) void client.invalidateQueries({ queryKey: ['current-session'] });
    });
  }, [next, csrfToken, uploader, client]);

  // Hook gắn từ lúc mở trang (chưa có ảnh) nên lần unmount giả của StrictMode không thu hồi nhầm URL.
  useEffect(() => {
    const urls = previews.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const add = useCallback((files: File[], profileId: string, declaredType: DocumentType | null) => {
    const planned = planUpload(files, { profileId, declaredType }, () => crypto.randomUUID());
    if (!planned.ok) return false;
    const withPreview = planned.items.map((item) => {
      if (item.status !== 'queued' || !PREVIEWABLE.test(item.file.type)) return item;
      const previewUrl = URL.createObjectURL(item.file);
      previews.current.push(previewUrl);
      return { ...item, previewUrl };
    });
    dispatch({ type: 'add', items: withPreview });
    return true;
  }, []);
  return { items, summary: summarizeQueue(items), add, dispatch };
}
