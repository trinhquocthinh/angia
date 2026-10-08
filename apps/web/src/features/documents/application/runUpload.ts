import { DocumentUploadError } from './DocumentUploadError';
import type { DocumentUploader, UploadBatchResponse } from './ports';
import type { UploadAction, UploadItem } from './uploadQueue';
import { rejectedFileMessage, uploadErrorMessage } from './uploadErrorMessage';

// Máy chủ chỉ nhận 3 lô cùng lúc (503 ERR_UPLOAD_BUSY + Retry-After): tự chờ rồi gửi lại tối đa 5 lần.
// Cộng 0–3 s ngẫu nhiên để nhiều người bị từ chối cùng lúc không gửi lại đồng loạt.
const MAX_BUSY_RETRIES = 5;
const DEFAULT_RETRY_AFTER_SECONDS = 10;
const MAX_RETRY_AFTER_SECONDS = 60;
const JITTER_SECONDS = 3;

interface Timing {
  sleep(ms: number): Promise<void>;
  random(): number;
}
const realTiming: Timing = {
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  random: Math.random,
};

const isBusy = (error: unknown): error is DocumentUploadError =>
  error instanceof DocumentUploadError && error.code === 'ERR_UPLOAD_BUSY';

function busyDelaySeconds(error: DocumentUploadError, random: number): number {
  const base = Math.min(
    MAX_RETRY_AFTER_SECONDS,
    Math.max(1, error.retryAfterSeconds ?? DEFAULT_RETRY_AFTER_SECONDS),
  );
  return base + random * JITTER_SECONDS;
}

// Tên multipart duy nhất trong lô (người dùng iOS hay có nhiều ảnh cùng tên "image.jpg"):
// API trả `rejectedFiles` theo tên và `documents` theo thứ tự gửi của tệp hợp lệ.
const batchFileName = (index: number, file: File) =>
  `anh-${String(index + 1).padStart(2, '0')}${/\.[a-z0-9]+$/i.exec(file.name)?.[0]?.toLowerCase() ?? ''}`;

function settleBatch(
  named: Array<{ item: UploadItem; fileName: string }>,
  batch: UploadBatchResponse,
  dispatch: (action: UploadAction) => void,
) {
  const rejected = new Map(batch.rejectedFiles.map((file) => [file.fileName, file.code]));
  const documents = batch.documents[Symbol.iterator]();
  for (const { item, fileName } of named) {
    const code = rejected.get(fileName);
    const documentId = code ? undefined : documents.next().value?.id;
    if (documentId) dispatch({ type: 'done', id: item.id, documentId });
    else dispatch({ type: 'fail', ids: [item.id], message: rejectedFileMessage(code) });
  }
}

// Gửi một lô ảnh (cùng hồ sơ/loại) trong một request và phát các action trạng thái;
// trả lỗi (nếu có) để hook xử lý phiên hết hạn.
export async function runUpload(
  items: UploadItem[],
  uploader: DocumentUploader,
  csrfToken: string,
  dispatch: (action: UploadAction) => void,
  timing: Timing = realTiming,
): Promise<unknown> {
  const first = items[0];
  if (!first?.profileId) return null;
  const ids = items.map((item) => item.id);
  const named = items.map((item, index) => {
    const file = item.upload ?? item.file;
    return { item, file, fileName: batchFileName(index, file) };
  });
  for (let busyRetries = 0; ; busyRetries += 1) {
    dispatch({ type: 'start', ids });
    try {
      const batch = await uploader.upload({
        profileId: first.profileId,
        files: named.map(({ fileName, file }) => ({ fileName, file })),
        declaredType: first.declaredType,
        csrfToken,
        onProgress: (percent) => dispatch({ type: 'progress', ids, percent }),
      });
      settleBatch(named, batch, dispatch);
      return null;
    } catch (error) {
      if (!isBusy(error) || busyRetries >= MAX_BUSY_RETRIES) {
        dispatch({ type: 'fail', ids, message: uploadErrorMessage(error) });
        return error;
      }
      const seconds = busyDelaySeconds(error, timing.random());
      const message = `Máy chủ bận · tự thử lại sau ${Math.ceil(seconds)} giây`;
      dispatch({ type: 'wait', ids, message });
      await timing.sleep(seconds * 1000);
    }
  }
}
