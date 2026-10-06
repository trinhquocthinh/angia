import { useCallback, useEffect, useReducer, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { DocumentType, DocumentUploader } from './ports';
import { runUpload } from './runUpload';
import { isSessionError } from './uploadErrorMessage';
import { nextQueued, planUpload, summarizeQueue, uploadQueueReducer } from './uploadQueue';

// Ảnh chỉ được gửi sau submit ("Xong"), lần lượt từng tấm. Không hủy request khi unmount: StrictMode
// giả lập unmount sẽ làm ảnh kẹt "đang tải"; rời trang giữa chừng thì ảnh còn chờ không được gửi.
export function useUploadQueue(uploader: DocumentUploader, csrfToken: string | undefined) {
  const client = useQueryClient();
  const [items, dispatch] = useReducer(uploadQueueReducer, []);
  const started = useRef(new Set<string>());
  const previews = useRef(new Map<string, string>());
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

  // Mọi ảnh hợp lệ đều thử xem trước (kể cả HEIC: Safari hiển thị được); trình duyệt không đọc được thì ô ảnh tự đổi sang biểu tượng.
  const add = useCallback((files: File[]) => {
    const planned = planUpload(files, () => crypto.randomUUID());
    if (!planned.ok) return false;
    const withPreview = planned.items.map((item) => {
      if (item.status === 'rejected') return item;
      const previewUrl = URL.createObjectURL(item.file);
      previews.current.set(item.id, previewUrl);
      return { ...item, previewUrl };
    });
    dispatch({ type: 'add', items: withPreview });
    return true;
  }, []);
  const submit = useCallback((profileId: string, declaredType: DocumentType | null) => {
    dispatch({ type: 'submit', profileId, declaredType });
  }, []);
  const remove = useCallback((id: string) => {
    const url = previews.current.get(id);
    if (url) URL.revokeObjectURL(url);
    previews.current.delete(id);
    dispatch({ type: 'remove', id });
  }, []);
  return { items, summary: summarizeQueue(items), add, submit, remove, dispatch };
}
