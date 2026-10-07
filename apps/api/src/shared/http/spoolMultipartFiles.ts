import { once } from 'node:events';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable, Transform, type Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import busboy from 'busboy';

// Đủ cho magic bytes JPEG/PNG/WebP và hộp ftyp của HEIC.
const HEAD_BYTES = 4096;
const MAX_FIELDS = 10;
const MAX_FIELD_BYTES = 1024;

export interface SpoolLimits {
  fieldName: string;
  maxFiles: number;
  maxFileBytes: number;
  maxBodyBytes: number;
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
type SpoolFailure = { ok: false; code: 'ERR_BATCH_TOO_LARGE' | 'ERR_VALIDATION' };
type SpoolOutcome = { ok: true; value: SpooledUpload } | SpoolFailure;

interface ParseState {
  files: Promise<SpooledFile>[];
  fields: Record<string, string>;
  failure: SpoolFailure['code'] | null;
}

// Nhận multipart theo luồng, ghi từng tệp ra thư mục tạm 0700 thay vì parse cả body vào RAM
// (lô 20 × 10 MiB vượt mem_limit 256 MB của API). Lô quá số tệp hoặc body quá trần dừng đọc ngay.
export async function spoolMultipartFiles(request: Request, limits: SpoolLimits): Promise<SpoolOutcome> {
  if (Number(request.headers.get('content-length') ?? 0) > limits.maxBodyBytes) {
    await request.body?.cancel();
    return { ok: false, code: 'ERR_BATCH_TOO_LARGE' };
  }
  const parser = createParser(request.headers.get('content-type'), limits);
  if (!request.body || !parser) return { ok: false, code: 'ERR_VALIDATION' };
  const dir = await mkdtemp(join(tmpdir(), 'angia-upload-'));
  const dispose = () => rm(dir, { recursive: true, force: true });
  try {
    const parsed = await parse(request.body, parser, dir, limits);
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
): Promise<ParseState> {
  const state: ParseState = { files: [], fields: {}, failure: null };
  parser.on('file', (name, stream, info) => {
    if (name !== limits.fieldName || state.failure) return void stream.resume();
    state.files.push(spoolFile(stream, join(dir, String(state.files.length)), info.filename ?? ''));
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
  const withinLimit = await feed(body, parser, limits.maxBodyBytes, () => state.failure !== null);
  if (!withinLimit) state.failure ??= 'ERR_BATCH_TOO_LARGE';
  if (state.failure) parser.destroy();
  await closed;
  // Chờ mọi luồng ghi đĩa kết thúc trước khi dọn thư mục; lỗi ghi khi lô đã hỏng thì bỏ qua.
  const settled = await Promise.allSettled(state.files);
  const writeError = settled.find((result) => result.status === 'rejected');
  if (writeError && !state.failure) throw writeError.reason;
  return state;
}

// Đếm byte thực nhận (không tin content-length) và tôn trọng backpressure của parser.
async function feed(
  body: ReadableStream<Uint8Array>,
  parser: Writable,
  maxBodyBytes: number,
  shouldStop: () => boolean,
): Promise<boolean> {
  const reader = body.getReader();
  let received = 0;
  for (;;) {
    if (shouldStop()) {
      await reader.cancel();
      return true;
    }
    const { done, value } = await reader.read();
    if (done) {
      parser.end();
      return true;
    }
    received += value.byteLength;
    if (received > maxBodyBytes) {
      await reader.cancel();
      return false;
    }
    if (!parser.write(value)) await once(parser, 'drain').catch(() => undefined);
  }
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
