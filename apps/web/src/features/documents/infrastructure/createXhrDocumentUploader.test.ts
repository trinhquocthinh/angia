import { describe, expect, it, vi } from 'vitest';
import { DocumentUploadError } from '../application/DocumentUploadError';
import { createXhrDocumentUploader } from './createXhrDocumentUploader';

class FakeXhr {
  status = 0;
  response: unknown = null;
  responseType = '';
  withCredentials = false;
  headers: Record<string, string> = {};
  opened: [string, string] | null = null;
  sent: FormData | null = null;
  upload: { onprogress: ((event: ProgressEvent) => void) | null } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  responseHeaders: Record<string, string> = {};
  getResponseHeader(name: string) {
    return this.responseHeaders[name.toLowerCase()] ?? null;
  }
  open(method: string, url: string) {
    this.opened = [method, url];
  }
  setRequestHeader(name: string, value: string) {
    this.headers[name] = value;
  }
  send(body: FormData) {
    this.sent = body;
  }
}
const start = (declaredType: 'lab_result' | null = 'lab_result') => {
  const xhr = new FakeXhr();
  const onProgress = vi.fn();
  const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], 'xn.jpg', { type: 'image/jpeg' });
  const promise = createXhrDocumentUploader(() => xhr as unknown as XMLHttpRequest).upload({
    profileId: 'p-1',
    files: [
      { fileName: 'anh-01.jpg', file },
      { fileName: 'anh-02.jpg', file },
    ],
    declaredType,
    csrfToken: 'csrf',
    onProgress,
  });
  return { xhr, onProgress, promise, file };
};

describe('Adapter XHR tải ảnh chứng từ', () => {
  it('gửi cả lô trong một multipart `files` + declaredType kèm CSRF và cookie, báo tiến trình', async () => {
    const { xhr, onProgress, promise } = start();
    expect(xhr.opened).toEqual(['POST', '/api/health-profiles/p-1/upload-batches']);
    expect(xhr.headers).toEqual({ 'X-CSRF-Token': 'csrf' });
    expect(xhr.withCredentials).toBe(true);
    const sent = xhr.sent!.getAll('files') as File[];
    expect(sent.map((part) => part.name)).toEqual(['anh-01.jpg', 'anh-02.jpg']);
    expect(sent[0]).toBeInstanceOf(File);
    expect(xhr.sent!.get('declaredType')).toBe('lab_result');
    xhr.upload.onprogress!({ lengthComputable: true, loaded: 32, total: 64 } as ProgressEvent);
    expect(onProgress).toHaveBeenCalledWith(50);
    const body = { id: 'b', documents: [], rejectedFiles: [] };
    Object.assign(xhr, { status: 201, response: body });
    xhr.onload!();
    await expect(promise).resolves.toEqual(body);
  });
  it('không gửi declaredType khi chưa chọn loại', () => {
    expect(start(null).xhr.sent!.has('declaredType')).toBe(false);
  });
  it('lỗi API giữ mã lỗi; lỗi mạng là status 0', async () => {
    const api = start();
    Object.assign(api.xhr, { status: 409, response: { error: { code: 'ERR_CONSENT_REQUIRED' } } });
    api.xhr.onload!();
    await expect(api.promise).rejects.toEqual(new DocumentUploadError(409, 'ERR_CONSENT_REQUIRED'));
    const network = start();
    network.xhr.onerror!();
    await expect(network.promise).rejects.toMatchObject({ status: 0 });
  });
  it.each([
    ['7', 7],
    ['không phải số', undefined],
    [undefined, undefined],
  ])('503 ERR_UPLOAD_BUSY mang theo Retry-After %s', async (header, seconds) => {
    const busy = start();
    Object.assign(busy.xhr, {
      status: 503,
      response: { error: { code: 'ERR_UPLOAD_BUSY' } },
      responseHeaders: header === undefined ? {} : { 'retry-after': header },
    });
    busy.xhr.onload!();
    await expect(busy.promise).rejects.toEqual(new DocumentUploadError(503, 'ERR_UPLOAD_BUSY', seconds));
    await expect(busy.promise).rejects.toMatchObject({ retryAfterSeconds: seconds });
  });
});
