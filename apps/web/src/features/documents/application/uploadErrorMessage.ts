import { DocumentUploadError } from './DocumentUploadError';
import type { RejectedFileCode } from './ports';

const BY_CODE: Record<string, string> = {
  ERR_NO_VALID_FILE: 'Tệp không phải ảnh JPG, PNG, HEIC, WebP hợp lệ hoặc vượt 10 MB.',
  ERR_CONSENT_REQUIRED: 'Hồ sơ chưa có đồng thuận. Gửi link mời ở Trang chủ trước khi tải ảnh.',
  ERR_NOT_FOUND: 'Không tìm thấy hồ sơ này trong gia đình.',
  ERR_UPLOAD_BUSY: 'Đang có nhiều người cùng tải ảnh. Chờ ít giây rồi bấm Thử lại.',
};

export function uploadErrorMessage(error: unknown): string {
  if (!(error instanceof DocumentUploadError)) return 'Không tải được ảnh. Vui lòng thử lại.';
  if (error.code && BY_CODE[error.code]) return BY_CODE[error.code]!;
  if (error.status === 0) return 'Mất kết nối. Kiểm tra mạng rồi thử lại.';
  if (error.status === 401 || error.status === 403)
    return 'Phiên đăng nhập đã thay đổi. Vui lòng tải lại trang.';
  return 'Không tải được ảnh. Vui lòng thử lại.';
}

export const isSessionError = (error: unknown) =>
  error instanceof DocumentUploadError && (error.status === 401 || error.status === 403);

// Tệp máy chủ loại trong lô (`rejectedFiles`), các ảnh khác của lô vẫn được nhận.
export function rejectedFileMessage(code: RejectedFileCode | undefined): string {
  if (code === 'ERR_FILE_TOO_LARGE') return 'Máy chủ không nhận: ảnh vượt quá 10 MB.';
  if (code === 'ERR_UNSUPPORTED_FILE')
    return 'Máy chủ không nhận: không phải ảnh JPG, PNG, HEIC, WebP hợp lệ.';
  return 'Không tải được ảnh. Vui lòng thử lại.';
}
