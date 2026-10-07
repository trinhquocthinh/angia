import { describe, expect, it, vi } from 'vitest';
import { DocumentUploadError } from './DocumentUploadError';
import type { DocumentUploader, UploadBatchResponse } from './ports';
import { runUpload } from './runUpload';
import type { UploadAction, UploadItem } from './uploadQueue';
import { isSessionError, uploadErrorMessage } from './uploadErrorMessage';

const item: UploadItem = {
  id: 'i1',
  file: { name: 'a.jpg' } as File,
  profileId: 'me',
  declaredType: 'prescription',
  status: 'queued',
  attempt: 0,
  progress: 0,
  problem: null,
  error: null,
  previewUrl: null,
};
const run = async (upload: DocumentUploader['upload']) => {
  const actions: UploadAction[] = [];
  const error = await runUpload(item, { upload }, 'csrf', (a) => actions.push(a));
  return { actions, error };
};

describe('Gửi một ảnh và cập nhật trạng thái', () => {
  it('TC-020: gửi đúng hồ sơ/loại/CSRF, báo tiến trình rồi xong', async () => {
    const upload = vi.fn<DocumentUploader['upload']>(async (request) => {
      request.onProgress(64);
      const document = { id: 'doc-1' } as UploadBatchResponse['documents'][number];
      return { id: 'b', documents: [document], rejectedFiles: [] };
    });
    const { actions, error } = await run(upload);
    expect(upload.mock.calls[0]![0]).toMatchObject({
      profileId: 'me',
      declaredType: 'prescription',
      csrfToken: 'csrf',
      file: item.file,
    });
    expect(actions).toEqual([
      { type: 'start', id: 'i1' },
      { type: 'progress', id: 'i1', percent: 64 },
      { type: 'done', id: 'i1', documentId: 'doc-1' },
    ]);
    expect(error).toBeNull();
  });
  it('TC-011: hồ sơ chưa đồng thuận → thông điệp hướng dẫn gửi link mời', async () => {
    const failure = new DocumentUploadError(409, 'ERR_CONSENT_REQUIRED');
    const { actions, error } = await run(async () => Promise.reject(failure));
    expect(actions.at(-1)).toEqual({ type: 'fail', id: 'i1', message: uploadErrorMessage(failure) });
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
});
