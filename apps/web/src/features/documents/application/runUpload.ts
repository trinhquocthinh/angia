import { DocumentUploadError } from './DocumentUploadError';
import type { DocumentUploader } from './ports';
import type { UploadAction, UploadItem } from './uploadQueue';
import { uploadErrorMessage } from './uploadErrorMessage';

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

// Gửi một ảnh và phát các action trạng thái; trả lỗi (nếu có) để hook xử lý phiên hết hạn.
export async function runUpload(
  item: UploadItem,
  uploader: DocumentUploader,
  csrfToken: string,
  dispatch: (action: UploadAction) => void,
  timing: Timing = realTiming,
): Promise<unknown> {
  if (!item.profileId) return null;
  for (let busyRetries = 0; ; busyRetries += 1) {
    dispatch({ type: 'start', id: item.id });
    try {
      const batch = await uploader.upload({
        profileId: item.profileId,
        file: item.file,
        declaredType: item.declaredType,
        csrfToken,
        onProgress: (percent) => dispatch({ type: 'progress', id: item.id, percent }),
      });
      dispatch({ type: 'done', id: item.id, documentId: batch.documents[0]?.id ?? null });
      return null;
    } catch (error) {
      if (!isBusy(error) || busyRetries >= MAX_BUSY_RETRIES) {
        dispatch({ type: 'fail', id: item.id, message: uploadErrorMessage(error) });
        return error;
      }
      const seconds = busyDelaySeconds(error, timing.random());
      const message = `Máy chủ bận · tự thử lại sau ${Math.ceil(seconds)} giây`;
      dispatch({ type: 'wait', id: item.id, message });
      await timing.sleep(seconds * 1000);
    }
  }
}
