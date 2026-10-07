// Khớp ngưỡng API (10 MiB). Kiểm tra sớm chỉ để báo lỗi nhanh; API vẫn kiểm magic bytes.
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
// Chrome/Firefox thường để type rỗng (hoặc octet-stream) với HEIC nên xét thêm đuôi tệp.
const UNKNOWN_TYPES = new Set(['', 'application/octet-stream']);
const IMAGE_EXTENSION = /\.(jpe?g|png|webp|heic|heif)$/i;

export type FileProblem = 'unsupported' | 'too_large';

export function checkUploadFile(file: Pick<File, 'name' | 'type' | 'size'>): FileProblem | null {
  if (!IMAGE_TYPES.has(file.type) && !(UNKNOWN_TYPES.has(file.type) && IMAGE_EXTENSION.test(file.name))) {
    return 'unsupported';
  }
  return file.size > MAX_FILE_BYTES ? 'too_large' : null;
}
