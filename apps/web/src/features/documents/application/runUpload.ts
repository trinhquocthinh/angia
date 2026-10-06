import type { DocumentUploader } from './ports';
import type { UploadAction, UploadItem } from './uploadQueue';
import { uploadErrorMessage } from './uploadErrorMessage';

// Gửi một ảnh và phát các action trạng thái; trả lỗi (nếu có) để hook xử lý phiên hết hạn.
export async function runUpload(
  item: UploadItem,
  uploader: DocumentUploader,
  csrfToken: string,
  dispatch: (action: UploadAction) => void,
): Promise<unknown> {
  dispatch({ type: 'start', id: item.id });
  try {
    await uploader.upload({
      profileId: item.profileId,
      file: item.file,
      declaredType: item.declaredType,
      csrfToken,
      onProgress: (percent) => dispatch({ type: 'progress', id: item.id, percent }),
    });
    dispatch({ type: 'done', id: item.id });
    return null;
  } catch (error) {
    dispatch({ type: 'fail', id: item.id, message: uploadErrorMessage(error) });
    return error;
  }
}
