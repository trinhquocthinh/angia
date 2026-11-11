import busboy from 'busboy';
import { feedMultipartBody, type BodyReadLimits } from './feedMultipartBody.js';

export interface ReadFileLimits extends BodyReadLimits {
  fieldName: string;
  maxFileBytes: number;
}
type ReadOutcome =
  { ok: true; bytes: Uint8Array } | { ok: false; code: 'ERR_VALIDATION' | 'ERR_UPLOAD_TIMEOUT' };

// Đúng một tệp, giữ trong RAM (≤ maxFileBytes): dùng cho ảnh chưa che của SPEC-083, không được chạm đĩa
// như spoolMultipartFiles. Timeout/trần body dùng chung feedMultipartBody.
export async function readMultipartFile(request: Request, limits: ReadFileLimits): Promise<ReadOutcome> {
  const invalid = { ok: false, code: 'ERR_VALIDATION' } as const;
  if (Number(request.headers.get('content-length') ?? 0) > limits.maxBodyBytes) {
    void request.body?.cancel().catch(() => undefined);
    return invalid;
  }
  const parser = createParser(request.headers.get('content-type'), limits.maxFileBytes);
  if (!request.body || !parser) return invalid;
  const chunks: Buffer[] = [];
  let files = 0;
  let failed = false;
  parser.on('file', (name, stream) => {
    files += 1;
    if (name !== limits.fieldName || files > 1) failed = true;
    stream.on('limit', () => (failed = true));
    stream.on('data', (chunk: Buffer) => void (failed || chunks.push(chunk)));
  });
  parser.on('filesLimit', () => (failed = true));
  const closed = new Promise<void>((resolve) => {
    parser.on('error', () => (failed = true));
    parser.on('close', resolve);
  });
  const result = await feedMultipartBody(request.body, parser, limits, request.signal, () => failed);
  if (result !== 'complete' || failed) parser.destroy();
  await closed;
  if (result === 'timeout') return { ok: false, code: 'ERR_UPLOAD_TIMEOUT' };
  if (result !== 'complete' || failed || files !== 1) return invalid;
  return { ok: true, bytes: new Uint8Array(Buffer.concat(chunks)) };
}

function createParser(contentType: string | null, maxFileBytes: number): busboy.Busboy | null {
  if (!contentType?.toLowerCase().startsWith('multipart/form-data')) return null;
  try {
    // files: 2 để phát hiện tệp thứ hai (filesLimit chỉ bắn khi vượt), fileSize +1 để biết đã vượt trần.
    return busboy({
      headers: { 'content-type': contentType },
      limits: { files: 2, fileSize: maxFileBytes + 1, fields: 0 },
    });
  } catch {
    return null; // thiếu boundary
  }
}
