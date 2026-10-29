import { describe, expect, it, vi } from 'vitest';
import { createMemoryDocumentDeps } from '@src/shared/test/createMemoryDocumentDeps.js';
import type { UploadedFile } from '../domain/SourceDocument.js';
import { uploadDocument } from './uploadDocument.js';

const profiles = [{ id: 'p', familyId: 'f', consentStatus: 'confirmed' as const }];
const file = (head = [255, 216, 255, 224]): UploadedFile => ({
  fileName: 'anh.jpg',
  sizeBytes: head.length,
  head: new Uint8Array(head),
  open: () => new Blob([new Uint8Array(head)]).stream(),
});
const request = (sendToAi: boolean[], files = sendToAi.map(() => file())) => ({
  familyId: 'f',
  accountId: 'a',
  profileId: 'p',
  files,
  sendToAi,
});

describe('Tải JPEG đã che và dấu đồng ý (SPEC-008)', () => {
  it('TC-407: tự nhập không có người duyệt, ảnh chờ làm sạch chưa có hash', async () => {
    const memory = createMemoryDocumentDeps(profiles);
    await uploadDocument(memory.deps, request([false]));
    expect(memory.documents[0]).toMatchObject({
      imageKey: 'families/f/profiles/p/documents/id-2/upload.jpg',
      imageSha256: null,
      privacyApprovedBy: null,
      status: 'uploaded',
    });
    expect(memory.jobs).toEqual([{ documentId: 'id-2', familyId: 'f' }]);
  });
  it('TC-406: cờ không lệch khi tệp đứng trước bị loại', async () => {
    const memory = createMemoryDocumentDeps(profiles);
    await uploadDocument(memory.deps, request([false, true], [file([1, 2, 3]), file()]));
    expect(memory.documents).toHaveLength(1);
    expect(memory.documents[0]?.privacyApprovedBy).toBe('a');
  });
  it('TC-405: use case từ chối cờ không khớp số tệp trước khi ghi', async () => {
    const memory = createMemoryDocumentDeps(profiles);
    expect(await uploadDocument(memory.deps, request([], [file()]))).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
    });
    expect(memory.batches).toEqual([]);
    expect(memory.objects.size).toBe(0);
  });
  it.each([
    [false, false],
    [true, false],
  ])('TC-438: lô %j chỉ đếm ảnh gửi AI', async (...flags) => {
    const memory = createMemoryDocumentDeps(profiles, {
      usage: { storageBytes: 0, uploadsToday: 0, pendingJobs: 9 },
    });
    expect((await uploadDocument(memory.deps, request(flags))).ok).toBe(true);
  });
  it('TC-438: hai ảnh gửi AI vượt trần thì từ chối cả lô trước ghi S3', async () => {
    const memory = createMemoryDocumentDeps(profiles, {
      usage: { storageBytes: 0, uploadsToday: 0, pendingJobs: 9 },
    });
    expect(await uploadDocument(memory.deps, request([true, true]))).toMatchObject({
      ok: false,
      code: 'ERR_QUEUE_QUOTA',
      details: { used: 9, requested: 2 },
    });
    expect(memory.batches).toEqual([]);
    expect(memory.objects.size).toBe(0);
  });
  it('TC-438: hàng đợi đầy vẫn cho phép tự nhập', async () => {
    const memory = createMemoryDocumentDeps(profiles, {
      usage: { storageBytes: 0, uploadsToday: 0, pendingJobs: 10 },
    });
    expect((await uploadDocument(memory.deps, request([false]))).ok).toBe(true);
  });
  it('TC-407: dọn cả khóa ghi dở khi S3 báo lỗi', async () => {
    const memory = createMemoryDocumentDeps(profiles, { failPutAt: 2 });
    const remove = vi.spyOn(memory.deps.storage, 'delete');
    await expect(uploadDocument(memory.deps, request([true, false]))).rejects.toThrow('S3 lỗi giả lập');
    expect(remove.mock.calls.map(([key]) => key)).toEqual([
      'families/f/profiles/p/documents/id-2/upload.jpg',
      'families/f/profiles/p/documents/id-3/upload.jpg',
    ]);
    expect(memory.documents).toEqual([]);
    expect(memory.jobs).toEqual([]);
    expect(memory.objects.size).toBe(0);
  });
});
