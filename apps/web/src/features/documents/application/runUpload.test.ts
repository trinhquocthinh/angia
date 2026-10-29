import { describe, expect, it, vi } from 'vitest';
import { DocumentUploadError } from './DocumentUploadError';
import type { DocumentUploader, UploadBatchResponse } from './ports';
import { runUpload } from './runUpload';
import type { UploadAction, UploadItem } from './uploadQueue';
import { isSessionError, uploadErrorMessage } from './uploadErrorMessage';

const item = (
  id: string,
  name: string,
  upload: File | null = { name: `${id}.jpg` } as File,
  sendToAi = false,
): UploadItem => ({
  id,
  file: { name } as File,
  upload,
  edits: null,
  sendToAi,
  thumbnailUrl: null,
  profileId: 'me',
  declaredType: 'prescription',
  status: 'queued',
  attempt: 0,
  progress: 0,
  problem: null,
  error: null,
  previewUrl: null,
});
const exported = { name: 'i1.jpg' } as File;
const items = [item('i1', 'IMG_1.HEIC', exported, true)];
const sleeps: number[] = [];
const timing = {
  sleep: async (ms: number) => {
    sleeps.push(ms);
  },
  random: () => 0.5,
};
const run = async (upload: DocumentUploader['upload'], batchItems = items) => {
  const actions: UploadAction[] = [];
  sleeps.length = 0;
  const error = await runUpload(batchItems, { upload }, 'csrf', (a) => actions.push(a), timing);
  return { actions, error };
};
const busy = (retryAfterSeconds?: number) =>
  new DocumentUploadError(503, 'ERR_UPLOAD_BUSY', retryAfterSeconds);
const documents = (...docIds: string[]) =>
  docIds.map((id) => ({ id })) as unknown as UploadBatchResponse['documents'];
const batch: UploadBatchResponse = { id: 'b', documents: documents('doc-1'), rejectedFiles: [] };

describe('Gửi một lô ảnh và cập nhật trạng thái từng ô', () => {
  it('TC-020/TC-432: gửi bản JPEG đã che kèm sendToAi, đúng hồ sơ/loại/CSRF, báo tiến trình rồi xong', async () => {
    const upload = vi.fn<DocumentUploader['upload']>(async (request) => {
      request.onProgress(64);
      return batch;
    });
    const { actions, error } = await run(upload);
    expect(upload.mock.calls[0]![0]).toMatchObject({
      profileId: 'me',
      declaredType: 'prescription',
      csrfToken: 'csrf',
      files: [{ fileName: 'anh-01.jpg', file: exported, sendToAi: true }],
    });
    expect(actions).toEqual([
      { type: 'start', ids: ['i1'] },
      { type: 'progress', ids: ['i1'], percent: 64 },
      { type: 'done', id: 'i1', documentId: 'doc-1' },
    ]);
    expect(error).toBeNull();
  });
  it('TC-021: cả lô một request; tệp máy chủ loại (rejectedFiles) gắn đúng ô dù trùng tên gốc', async () => {
    const batchItems = [item('i1', 'image.jpg'), item('i2', 'image.jpg'), item('i3', 'scan.png')];
    const upload = vi.fn<DocumentUploader['upload']>(async () => ({
      id: 'b',
      documents: documents('doc-1', 'doc-3'),
      rejectedFiles: [{ fileName: 'anh-02.jpg', code: 'ERR_UNSUPPORTED_FILE' }],
    }));
    const { actions } = await run(upload, batchItems);
    expect(upload).toHaveBeenCalledOnce();
    expect(upload.mock.calls[0]![0].files.map((f) => f.fileName)).toEqual([
      'anh-01.jpg',
      'anh-02.jpg',
      'anh-03.jpg',
    ]);
    expect(actions.slice(1)).toEqual([
      { type: 'done', id: 'i1', documentId: 'doc-1' },
      { type: 'fail', ids: ['i2'], message: expect.stringMatching(/JPG, PNG, HEIC, WebP/) },
      { type: 'done', id: 'i3', documentId: 'doc-3' },
    ]);
  });
  it('không bao giờ gửi ảnh gốc: mục chưa có bản đã che làm cả lô lỗi, không gọi API', async () => {
    const upload = vi.fn<DocumentUploader['upload']>(async () => batch);
    const { actions } = await run(upload, [item('i1', 'IMG_1.jpg'), item('i2', 'IMG_2.jpg', null)]);
    expect(upload).not.toHaveBeenCalled();
    expect(actions).toEqual([
      { type: 'fail', ids: ['i1', 'i2'], message: 'Ảnh chưa được che. Mở ảnh để che rồi gửi lại.' },
    ]);
  });
  it('TC-011: hồ sơ chưa đồng thuận → thông điệp hướng dẫn gửi link mời', async () => {
    const failure = new DocumentUploadError(409, 'ERR_CONSENT_REQUIRED');
    const { actions, error } = await run(async () => Promise.reject(failure));
    expect(actions.at(-1)).toEqual({ type: 'fail', ids: ['i1'], message: uploadErrorMessage(failure) });
    expect(uploadErrorMessage(failure)).toMatch(/đồng thuận/);
    expect(error).toBe(failure);
  });
  it.each([
    [new DocumentUploadError(422, 'ERR_NO_VALID_FILE'), /10 MB/, false],
    [new DocumentUploadError(0), /Mất kết nối/, false],
    [new DocumentUploadError(503, 'ERR_UPLOAD_BUSY'), /nhiều người.*Thử lại/s, false],
    [new DocumentUploadError(403, 'ERR_FORBIDDEN'), /Phiên đăng nhập/, true],
    [new DocumentUploadError(500, 'ERR_INTERNAL'), /thử lại/, false],
    [new Error('lạ'), /thử lại/, false],
  ])('thông điệp lỗi %#', (failure, message, session) => {
    expect(uploadErrorMessage(failure)).toMatch(message);
    expect(isSessionError(failure)).toBe(session);
  });

  it('TC-108: máy chủ bận → chờ Retry-After + 0–3 s ngẫu nhiên rồi tự gửi lại, báo đang chờ trên ô ảnh', async () => {
    const upload = vi
      .fn<DocumentUploader['upload']>()
      .mockRejectedValueOnce(busy(7))
      .mockRejectedValueOnce(busy(7))
      .mockResolvedValueOnce(batch);
    const { actions, error } = await run(upload);
    expect(upload).toHaveBeenCalledTimes(3);
    expect(sleeps).toEqual([8500, 8500]);
    expect(actions).toEqual([
      { type: 'start', ids: ['i1'] },
      { type: 'wait', ids: ['i1'], message: 'Máy chủ bận · tự thử lại sau 9 giây' },
      { type: 'start', ids: ['i1'] },
      { type: 'wait', ids: ['i1'], message: 'Máy chủ bận · tự thử lại sau 9 giây' },
      { type: 'start', ids: ['i1'] },
      { type: 'done', id: 'i1', documentId: 'doc-1' },
    ]);
    expect(error).toBeNull();
  });
  it.each([
    ['không có Retry-After → 10 s', undefined, 11500],
    ['Retry-After quá lớn → tối đa 60 s', 600, 61500],
    ['Retry-After 0 → tối thiểu 1 s', 0, 2500],
  ])('%s', async (_name, retryAfter, ms) => {
    await run(
      vi
        .fn<DocumentUploader['upload']>()
        .mockRejectedValueOnce(busy(retryAfter))
        .mockResolvedValueOnce(batch),
    );
    expect(sleeps).toEqual([ms]);
  });
  it('bận quá 5 lần tự thử → báo lỗi để người dùng bấm Thử lại', async () => {
    const upload = vi.fn<DocumentUploader['upload']>().mockRejectedValue(busy(1));
    const { actions, error } = await run(upload);
    expect(upload).toHaveBeenCalledTimes(6);
    expect(sleeps).toHaveLength(5);
    expect(actions.at(-1)).toEqual({ type: 'fail', ids: ['i1'], message: uploadErrorMessage(busy()) });
    expect(error).toEqual(busy(1));
  });
  it('lỗi khác (vd. 500) không tự thử lại', async () => {
    const upload = vi.fn<DocumentUploader['upload']>().mockRejectedValue(new DocumentUploadError(500));
    await run(upload);
    expect(upload).toHaveBeenCalledTimes(1);
    expect(sleeps).toEqual([]);
  });
});

describe('Lỗi quota/rate limit không tự gửi lại (SPEC-030)', () => {
  it('TC-302: ERR_QUEUE_QUOTA → báo lỗi ngay, không chờ hay thử lại', async () => {
    const upload = vi.fn<DocumentUploader['upload']>(async () => {
      throw new DocumentUploadError(429, 'ERR_QUEUE_QUOTA', 30);
    });
    const { actions } = await run(upload);
    expect(upload).toHaveBeenCalledTimes(1);
    expect(sleeps).toEqual([]);
    expect(actions.at(-1)).toEqual({
      type: 'fail',
      ids: ['i1'],
      message: 'Đang có nhiều ảnh chờ xử lý. Vui lòng đợi xử lý xong rồi gửi tiếp.',
    });
  });
});
