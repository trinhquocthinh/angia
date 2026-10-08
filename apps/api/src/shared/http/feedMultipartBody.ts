import { once } from 'node:events';
import type { Writable } from 'node:stream';

export interface BodyReadLimits {
  maxBodyBytes: number;
  idleTimeoutMs?: number;
  bodyTimeoutMs?: number;
}
type FeedResult = 'complete' | 'too-large' | 'timeout' | 'invalid';

// Deadline tổng ngăn gửi nhỏ giọt; idle không được reset bằng chunk rỗng.
export async function feedMultipartBody(
  body: ReadableStream<Uint8Array>,
  parser: Writable,
  limits: BodyReadLimits,
  requestSignal: AbortSignal,
  shouldStop: () => boolean,
): Promise<FeedResult> {
  const reader = body.getReader();
  const abort = new AbortController();
  const onAbort = () => abort.abort('invalid');
  const total = setTimeout(() => abort.abort('timeout'), limits.bodyTimeoutMs ?? 300_000);
  let idle: ReturnType<typeof setTimeout>;
  const resetIdle = () => {
    clearTimeout(idle);
    idle = setTimeout(() => abort.abort('timeout'), limits.idleTimeoutMs ?? 30_000);
  };
  const stopped = new Promise<null>((resolve) =>
    abort.signal.addEventListener('abort', () => resolve(null), { once: true }),
  );
  requestSignal.addEventListener('abort', onAbort, { once: true });
  parser.once('close', onAbort);
  if (requestSignal.aborted) onAbort();
  resetIdle();
  let complete = false;
  try {
    const result = await receive(reader, parser, limits.maxBodyBytes, shouldStop, stopped, abort, resetIdle);
    complete = result === 'complete';
    return result;
  } finally {
    clearTimeout(total);
    clearTimeout(idle!);
    requestSignal.removeEventListener('abort', onAbort);
    parser.off('close', onAbort);
    // Không chờ cancel: nguồn bị treo không được phép giữ slot hoặc cản việc dọn đĩa.
    if (!complete) void reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

async function receive(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  parser: Writable,
  maxBodyBytes: number,
  shouldStop: () => boolean,
  stopped: Promise<null>,
  abort: AbortController,
  resetIdle: () => void,
): Promise<FeedResult> {
  let received = 0;
  try {
    for (;;) {
      if (shouldStop()) return 'invalid';
      if (abort.signal.aborted) return abort.signal.reason as FeedResult;
      const chunk = await Promise.race([reader.read(), stopped]);
      if (!chunk) return abort.signal.reason as FeedResult;
      if (chunk.done) {
        parser.end();
        return 'complete';
      }
      if (chunk.value.byteLength > 0) resetIdle();
      received += chunk.value.byteLength;
      if (received > maxBodyBytes) return 'too-large';
      if (!parser.write(chunk.value)) await once(parser, 'drain', { signal: abort.signal });
    }
  } catch {
    return abort.signal.aborted ? (abort.signal.reason as FeedResult) : 'invalid';
  }
}
