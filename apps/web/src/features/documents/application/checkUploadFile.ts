// Ảnh gốc tới 30 MiB được nhận vì sẽ nén trên trình duyệt trước khi gửi (E3-S1-T2, chủ dự án chốt
// 2026-10-08); trần 10 MiB của API kiểm sau khi nén (prepareUpload). API vẫn kiểm magic bytes.
const MAX_ORIGINAL_BYTES = 30 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
// Chrome/Firefox thường để type rỗng (hoặc octet-stream) với HEIC nên xét thêm đuôi tệp.
const UNKNOWN_TYPES = new Set(['', 'application/octet-stream']);
const IMAGE_EXTENSION = /\.(jpe?g|png|webp|heic|heif)$/i;

// not_compressible: trình duyệt không nén được (vd. HEIC trên Chrome) mà tệp vẫn vượt 10 MiB.
export type FileProblem = 'unsupported' | 'too_large' | 'not_compressible';

export function checkUploadFile(file: Pick<File, 'name' | 'type' | 'size'>): FileProblem | null {
  if (!IMAGE_TYPES.has(file.type) && !(UNKNOWN_TYPES.has(file.type) && IMAGE_EXTENSION.test(file.name))) {
    return 'unsupported';
  }
  return file.size > MAX_ORIGINAL_BYTES ? 'too_large' : null;
}
