import { useCallback, useEffect, useReducer, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { DocumentType, DocumentUploader, ImagePreparer } from './ports';
import { prepareUpload } from './prepareUpload';
import { runUpload } from './runUpload';
import { isSessionError } from './uploadErrorMessage';
import { nextBatch, nextPreparing, planUpload, summarizeQueue, uploadQueueReducer } from './uploadQueue';

// Ảnh được nén ngay khi thêm (lần lượt từng tấm), chỉ gửi sau submit ("Xong") theo lô ≤ 10 ảnh/request.
// Không hủy request khi unmount: StrictMode giả lập unmount sẽ làm ảnh kẹt "đang tải".
export function useUploadQueue(
  uploader: DocumentUploader,
  prepare: ImagePreparer,
  csrfToken: string | undefined,
) {
  const client = useQueryClient();
  const [items, dispatch] = useReducer(uploadQueueReducer, []);
  const started = useRef(new Set<string>());
  const previews = useRef(new Map<string, string>());

  // StrictMode chạy effect hai lần trước khi state kịp áp dụng: khóa theo id (nén) và id:lượt (gửi).
  useEffect(() => {
    const item = nextPreparing(items);
    if (!item || started.current.has(`prepare:${item.id}`)) return;
    started.current.add(`prepare:${item.id}`);
    void prepareUpload(item.file, prepare).then((result) =>
      dispatch(
        result.ok
          ? { type: 'prepared', id: item.id, upload: result.upload }
          : { type: 'reject', id: item.id, problem: result.problem },
      ),
    );
  }, [items, prepare]);

  useEffect(() => {
    const batch = csrfToken ? nextBatch(items) : [];
    const key = batch.map((item) => `${item.id}:${item.attempt}`).join(',');
    if (!csrfToken || !key || started.current.has(key)) return;
    started.current.add(key);
    void runUpload(batch, uploader, csrfToken, dispatch).then((error) => {
      if (isSessionError(error)) void client.invalidateQueries({ queryKey: ['current-session'] });
    });
  }, [items, csrfToken, uploader, client]);

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
