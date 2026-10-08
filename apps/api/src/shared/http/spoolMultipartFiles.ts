import { createReadStream, createWriteStream } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import busboy from 'busboy';
import { feedMultipartBody, type BodyReadLimits } from './feedMultipartBody.js';

// Đủ cho magic bytes JPEG/PNG/WebP và hộp ftyp của HEIC.
const HEAD_BYTES = 4096;
const MAX_FIELDS = 10;
const MAX_FIELD_BYTES = 1024;

export interface SpoolLimits extends BodyReadLimits {
  fieldName: string;
  maxFiles: number;
  maxFileBytes: number;
}
interface SpooledFile {
  fileName: string;
  /** Số byte đã nhận; tệp vượt `maxFileBytes` dừng ghi ở `maxFileBytes + 1` byte. */
  sizeBytes: number;
  head: Uint8Array;
  open(): ReadableStream<Uint8Array>;
}
interface SpooledUpload {
  files: SpooledFile[];
  fields: Record<string, string>;
  /** Xóa thư mục tạm; gọi trong `finally` của handler. */
  dispose(): Promise<void>;
}
type SpoolFailure = { ok: false; code: 'ERR_BATCH_TOO_LARGE' | 'ERR_VALIDATION' | 'ERR_UPLOAD_TIMEOUT' };
type SpoolOutcome = { ok: true; value: SpooledUpload } | SpoolFailure;

interface ParseState {
  files: Promise<SpooledFile>[];
  fields: Record<string, string>;
  failure: SpoolFailure['code'] | null;
}

// Nhận multipart theo luồng, ghi từng tệp ra thư mục tạm 0700 thay vì parse cả body vào RAM
// (lô 10 × 10 MiB = 100 MiB, nhân số người tải đồng thời, dễ vượt mem_limit 256 MB của API). Lô quá số tệp hoặc body quá trần dừng đọc ngay.
export async function spoolMultipartFiles(request: Request, limits: SpoolLimits): Promise<SpoolOutcome> {
  if (Number(request.headers.get('content-length') ?? 0) > limits.maxBodyBytes) {
    void request.body?.cancel().catch(() => undefined);
    return { ok: false, code: 'ERR_BATCH_TOO_LARGE' };
  }
  const parser = createParser(request.headers.get('content-type'), limits);
  if (!request.body || !parser) return { ok: false, code: 'ERR_VALIDATION' };
  const dir = await mkdtemp(join(tmpdir(), 'angia-upload-'));
  const dispose = () => rm(dir, { recursive: true, force: true });
  try {
    const parsed = await parse(request.body, parser, dir, limits, request.signal);
    if (parsed.failure) {
      await dispose();
      return { ok: false, code: parsed.failure };
    }
    return { ok: true, value: { files: await Promise.all(parsed.files), fields: parsed.fields, dispose } };
  } catch (error) {
    await dispose();
    throw error;
  }
}

function createParser(contentType: string | null, limits: SpoolLimits): busboy.Busboy | null {
  if (!contentType?.toLowerCase().startsWith('multipart/form-data')) return null;
  try {
    return busboy({
      headers: { 'content-type': contentType },
      defParamCharset: 'utf8',
      limits: {
        files: limits.maxFiles,
        fileSize: limits.maxFileBytes + 1,
        fields: MAX_FIELDS,
        fieldSize: MAX_FIELD_BYTES,
      },
    });
  } catch {
    return null; // thiếu boundary
  }
}

async function parse(
  body: ReadableStream<Uint8Array>,
  parser: busboy.Busboy,
  dir: string,
  limits: SpoolLimits,
  signal: AbortSignal,
): Promise<ParseState> {
  const state: ParseState = { files: [], fields: {}, failure: null };
  parser.on('file', (name, stream, info) => {
    if (name !== limits.fieldName || state.failure) return void stream.resume();
    const file = spoolFile(stream, join(dir, String(state.files.length)), info.filename ?? '');
    void file.catch(() => undefined); // Gắn xử lý lỗi ngay, rồi thu kết quả bằng allSettled ở dưới.
    state.files.push(file);
  });
  parser.on('field', (name, value) => {
    state.fields[name] = value;
  });
  parser.on('filesLimit', () => {
    state.failure ??= 'ERR_BATCH_TOO_LARGE';
  });
  const closed = new Promise<void>((resolve) => {
    parser.on('error', () => {
      state.failure ??= 'ERR_VALIDATION';
    });
    parser.on('close', resolve);
  });
  const result = await feedMultipartBody(body, parser, limits, signal, () => state.failure !== null);
  if (result !== 'complete') {
    state.failure ??=
      result === 'timeout'
        ? 'ERR_UPLOAD_TIMEOUT'
        : result === 'too-large'
          ? 'ERR_BATCH_TOO_LARGE'
          : 'ERR_VALIDATION';
  }
  if (state.failure) parser.destroy();
  await closed;
  // Chờ mọi luồng ghi đĩa kết thúc trước khi dọn thư mục; lỗi ghi khi lô đã hỏng thì bỏ qua.
  const settled = await Promise.allSettled(state.files);
  const writeError = settled.find((result) => result.status === 'rejected');
  if (writeError && !state.failure) throw writeError.reason;
  return state;
}

async function spoolFile(stream: Readable, path: string, fileName: string): Promise<SpooledFile> {
  const head: Buffer[] = [];
  let headBytes = 0;
  let sizeBytes = 0;
  const measure = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      sizeBytes += chunk.length;
      if (headBytes < HEAD_BYTES) {
        const part = chunk.subarray(0, HEAD_BYTES - headBytes);
        head.push(part);
        headBytes += part.length;
      }
      callback(null, chunk);
    },
  });
  await pipeline(stream, measure, createWriteStream(path, { mode: 0o600 }));
  const open = () => Readable.toWeb(createReadStream(path)) as ReadableStream<Uint8Array>;
  return { fileName, sizeBytes, head: Buffer.concat(head), open };
}
