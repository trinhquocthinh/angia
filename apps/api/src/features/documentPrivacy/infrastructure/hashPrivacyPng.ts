import { createHash } from 'node:crypto';
import { MAX_FILE_BYTES } from '../../documents/domain/SourceDocument.js';
// Không decode ảnh hoặc đệm toàn nội dung; hủy luồng ngay khi vượt 10 MiB.
export async function hashPrivacyPng(body: ReadableStream<Uint8Array>): Promise<string | null> {
  const reader = body.getReader();
  const hash = createHash('sha256');
  const signature = new Uint8Array(8);
  let size = 0,
    head = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > MAX_FILE_BYTES) {
        await reader.cancel();
        return null;
      }
      for (const byte of part.value) {
        if (head >= 8) break;
        signature[head++] = byte;
      }
      hash.update(part.value);
    }
    const expected = [137, 80, 78, 71, 13, 10, 26, 10];
    return head === 8 && expected.every((byte, i) => signature[i] === byte) ? hash.digest('hex') : null;
  } finally {
    reader.releaseLock();
  }
}
