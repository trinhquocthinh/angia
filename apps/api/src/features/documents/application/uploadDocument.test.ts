import { describe, expect, it } from 'vitest';
import { createMemoryDocumentDeps } from '@src/shared/test/createMemoryDocumentDeps.js';
import { MAX_FILE_BYTES } from '../domain/SourceDocument.js';
import { uploadDocument } from './uploadDocument.js';

const jpeg = (size = 3 * 1024 * 1024) => {
  const bytes = new Uint8Array(size);
  bytes.set([0xff, 0xd8, 0xff, 0xe0]);
  return bytes;
};
const profiles = [
  { id: 'me', familyId: 'family-a', consentStatus: 'confirmed' as const },
  { id: 'cha', familyId: 'family-a', consentStatus: 'invited' as const },
  { id: 'khac', familyId: 'family-b', consentStatus: 'confirmed' as const },
];
const request = (overrides: Partial<Parameters<typeof uploadDocument>[1]> = {}) => ({
  familyId: 'family-a',
  accountId: 'account-a',
  profileId: 'me',
  files: [{ fileName: 'don-thuoc.jpg', bytes: jpeg() }],
  ...overrides,
});

describe('Tải lên 01 ảnh chứng từ (SPEC-008, E2-S5-T1)', () => {
  it('TC-020: ảnh JPEG 3 MB tạo 01 chứng từ uploaded trong một lô và lưu ảnh gốc theo tiền tố', async () => {
    const memory = createMemoryDocumentDeps(profiles);
    const result = await uploadDocument(memory.deps, request({ declaredType: 'prescription' }));
    expect(result).toEqual({
      ok: true,
      value: { id: 'id-1', documents: [memory.documents[0]], rejectedFiles: [] },
    });
    expect(memory.batches).toEqual([{ id: 'id-1', healthProfileId: 'me', createdBy: 'account-a' }]);
    const key = 'families/family-a/profiles/me/documents/id-2/original.jpg';
    expect(memory.documents[0]).toMatchObject({
      id: 'id-2',
      batchId: 'id-1',
      healthProfileId: 'me',
      status: 'uploaded',
      type: 'prescription',
      originalKey: key,
      mimeType: 'image/jpeg',
      sizeBytes: 3 * 1024 * 1024,
    });
    expect(memory.objects.get(key)?.contentType).toBe('image/jpeg');
  });

  it('SPEC-008 → SPEC-009: chứng từ hợp lệ được đẩy job extract-document kèm nhóm của phiên', async () => {
    const memory = createMemoryDocumentDeps(profiles);
    await uploadDocument(memory.deps, request());
    expect(memory.jobs).toEqual([{ documentId: 'id-2', familyId: 'family-a' }]);
  });

  it('TC-011: hồ sơ chưa đồng thuận bị chặn ERR_CONSENT_REQUIRED, không lưu gì', async () => {
    const memory = createMemoryDocumentDeps(profiles);
    expect(await uploadDocument(memory.deps, request({ profileId: 'cha' }))).toEqual({
      ok: false,
      code: 'ERR_CONSENT_REQUIRED',
    });
    expect([memory.documents, memory.batches, [...memory.objects], memory.jobs]).toEqual([[], [], [], []]);
  });

  it('SPEC-006: hồ sơ nhóm khác và không tồn tại đều ERR_NOT_FOUND', async () => {
    const memory = createMemoryDocumentDeps(profiles);
    for (const profileId of ['khac', 'khong-co']) {
      expect(await uploadDocument(memory.deps, request({ profileId }))).toEqual({
        ok: false,
        code: 'ERR_NOT_FOUND',
      });
    }
    expect(memory.objects.size).toBe(0);
  });

  it.each([
    ['TC-026: tệp vượt 10 MiB', jpeg(MAX_FILE_BYTES + 1)],
    ['TC-024: tệp PDF', new TextEncoder().encode('%PDF-1.7')],
  ])('%s là tệp duy nhất → ERR_NO_VALID_FILE, không lưu gì', async (_name, bytes) => {
    const memory = createMemoryDocumentDeps(profiles);
    expect(await uploadDocument(memory.deps, request({ files: [{ fileName: 'x', bytes }] }))).toEqual({
      ok: false,
      code: 'ERR_NO_VALID_FILE',
    });
    expect([memory.documents, memory.batches, [...memory.objects]]).toEqual([[], [], []]);
  });

  it.each([0, 2])('ảnh đơn: %s tệp trong request → ERR_VALIDATION', async (count) => {
    const memory = createMemoryDocumentDeps(profiles);
    const files = Array.from({ length: count }, () => ({ fileName: 'a.jpg', bytes: jpeg(16) }));
    expect(await uploadDocument(memory.deps, request({ files }))).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
    });
  });

  it('lỗi S3 giữa chừng: dọn object đã ghi, không còn bản ghi, ném lỗi lên', async () => {
    const memory = createMemoryDocumentDeps(profiles, { failPutAt: 1 });
    await expect(uploadDocument(memory.deps, request())).rejects.toThrow('S3 lỗi giả lập');
    expect([memory.documents, memory.batches, [...memory.objects]]).toEqual([[], [], []]);
  });

  it('lỗi DB sau khi đã ghi S3 (commit thất bại): xóa object đã ghi', async () => {
    const memory = createMemoryDocumentDeps(profiles);
    const failingCommit = {
      ...memory.deps,
      repository: {
        withFamily: async <T>(
          familyId: string,
          work: Parameters<typeof memory.deps.repository.withFamily<T>>[1],
        ) => {
          await memory.deps.repository.withFamily(familyId, work);
          throw new Error('commit lỗi');
        },
      },
    };
    await expect(uploadDocument(failingCommit, request())).rejects.toThrow('commit lỗi');
    expect(memory.objects.size).toBe(0);
  });
});
