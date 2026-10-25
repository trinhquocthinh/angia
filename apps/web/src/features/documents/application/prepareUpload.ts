import type { ImagePreparer } from './ports';

// Khớp trần một tệp của API (SPEC-008: 10 MiB), kiểm trên bản sẽ gửi.
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export async function prepareUpload(
  file: File,
  compress: ImagePreparer,
): Promise<{ ok: true; upload: File } | { ok: false; problem: 'not_compressible' }> {
  const upload = await compress(file);
  return upload.size > MAX_UPLOAD_BYTES ? { ok: false, problem: 'not_compressible' } : { ok: true, upload };
}
