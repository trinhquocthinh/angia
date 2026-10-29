import { type FileRejectionCode, MAX_FILE_BYTES } from './SourceDocument.js';

type Classification =
  { ok: true; mimeType: 'image/jpeg'; extension: 'jpg' } | { ok: false; code: FileRejectionCode };

// Không tin tên tệp hay Content-Type do client khai (SPEC-008).
export function classifyFile(head: Uint8Array, sizeBytes = head.length): Classification {
  if (sizeBytes > MAX_FILE_BYTES) return { ok: false, code: 'ERR_FILE_TOO_LARGE' };
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    return { ok: true, mimeType: 'image/jpeg', extension: 'jpg' };
  }
  return { ok: false, code: 'ERR_UNSUPPORTED_FILE' };
}
