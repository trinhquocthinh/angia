import { describe, expect, it } from 'vitest';
import { createMemoryDocumentDeps } from '@src/shared/test/createMemoryDocumentDeps.js';
import { MAX_FILE_BYTES, MAX_FILES_PER_UPLOAD, type UploadedFile } from '../domain/SourceDocument.js';
import { uploadDocument } from './uploadDocument.js';

const jpeg = (size = 3 * 1024 * 1024) => {
  const bytes = new Uint8Array(size);
  bytes.set([0xff, 0xd8, 0xff, 0xe0]);
  return bytes;
};
const pdf = new TextEncoder().encode('%PDF-1.7');
// Tệp đã nhận đủ: phần đầu để nhận diện, nội dung chỉ mở khi lưu; ghi lại tên tệp đã bị mở.
const reads: string[] = [];
const file = (fileName: string, bytes: Uint8Array): UploadedFile => ({
  fileName,
  sizeBytes: bytes.length,
  head: bytes.subarray(0, 64),
  open: () => {
    reads.push(fileName);
    return new Blob([bytes]).stream();
  },
});
const jpegs = (count: number) => Array.from({ length: count }, (_, i) => file(`anh-${i + 1}.jpg`, jpeg(16)));
const profiles = [
  { id: 'me', familyId: 'family-a', consentStatus: 'confirmed' as const },
  { id: 'cha', familyId: 'family-a', consentStatus: 'invited' as const },
  { id: 'khac', familyId: 'family-b', consentStatus: 'confirmed' as const },
];
const request = (overrides: Partial<Parameters<typeof uploadDocument>[1]> = {}) => ({
  familyId: 'family-a',
  accountId: 'account-a',
  profileId: 'me',
  files: [file('don-thuoc.jpg', jpeg())],
  ...overrides,
});

describe('Tải lên chứng từ đơn lẻ hoặc theo lô (SPEC-008)', () => {
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
    expect(memory.objects.get(key)?.body.length).toBe(3 * 1024 * 1024);
  });

  it('SPEC-008 → SPEC-009: chứng từ hợp lệ được đẩy job convert-heic kèm nhóm của phiên', async () => {
    const memory = createMemoryDocumentDeps(profiles);
    await uploadDocument(memory.deps, request());
    expect(memory.jobs).toEqual([{ documentId: 'id-2', familyId: 'family-a' }]);
  });

  it('TC-081: lô đúng 10 tệp tạo 10 chứng từ chung một lô, mỗi chứng từ một job', async () => {
    expect(MAX_FILES_PER_UPLOAD).toBe(10);
    const memory = createMemoryDocumentDeps(profiles);
    const result = await uploadDocument(memory.deps, request({ files: jpegs(10) }));
    expect(result).toMatchObject({ ok: true, value: { id: 'id-1', rejectedFiles: [] } });
    expect(memory.batches).toHaveLength(1);
    expect(memory.documents).toHaveLength(10);
    expect(new Set(memory.documents.map((d) => d.batchId))).toEqual(new Set(['id-1']));
    expect(memory.jobs).toHaveLength(10);
  });

  it('TC-023: lô 11 tệp → ERR_BATCH_TOO_LARGE, không lưu tệp nào', async () => {
    const memory = createMemoryDocumentDeps(profiles);
    expect(await uploadDocument(memory.deps, request({ files: jpegs(11) }))).toEqual({
      ok: false,
      code: 'ERR_BATCH_TOO_LARGE',
    });
    expect([memory.documents, memory.batches, [...memory.objects], memory.jobs]).toEqual([[], [], [], []]);
  });

  it('TC-024/TC-080: lô 9 ảnh + PDF + ảnh 10 MiB + 1 byte → lưu ảnh hợp lệ, tệp lỗi vào rejectedFiles', async () => {
    reads.length = 0;
    const memory = createMemoryDocumentDeps(profiles);
    const files = [
      ...jpegs(8),
      file('vua-du.jpg', jpeg(MAX_FILE_BYTES)),
      file('ket-qua.pdf', pdf),
      file('qua-lon.jpg', jpeg(MAX_FILE_BYTES + 1)),
    ];
    const result = await uploadDocument(memory.deps, request({ files: files.slice(0, 10) }));
    expect(result).toMatchObject({
      ok: true,
      value: { rejectedFiles: [{ fileName: 'ket-qua.pdf', code: 'ERR_UNSUPPORTED_FILE' }] },
    });
    expect(memory.documents).toHaveLength(9);

    const oversized = await uploadDocument(memory.deps, request({ files: files.slice(1) }));
    expect(oversized).toMatchObject({
      ok: true,
      value: {
        rejectedFiles: [
          { fileName: 'ket-qua.pdf', code: 'ERR_UNSUPPORTED_FILE' },
          { fileName: 'qua-lon.jpg', code: 'ERR_FILE_TOO_LARGE' },
        ],
      },
    });
    expect(reads).not.toContain('ket-qua.pdf');
    expect(reads).not.toContain('qua-lon.jpg');
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
    ['TC-024: tệp PDF', pdf],
  ])('%s là tệp duy nhất → ERR_NO_VALID_FILE, không lưu gì', async (_name, bytes) => {
    const memory = createMemoryDocumentDeps(profiles);
    expect(await uploadDocument(memory.deps, request({ files: [file('x', bytes)] }))).toEqual({
      ok: false,
      code: 'ERR_NO_VALID_FILE',
    });
    expect([memory.documents, memory.batches, [...memory.objects]]).toEqual([[], [], []]);
  });

  it('request không có tệp nào → ERR_VALIDATION', async () => {
    const memory = createMemoryDocumentDeps(profiles);
    expect(await uploadDocument(memory.deps, request({ files: [] }))).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
    });
  });

  it('lỗi S3 giữa lô: dọn mọi object đã ghi, không còn bản ghi, ném lỗi lên', async () => {
    const memory = createMemoryDocumentDeps(profiles, { failPutAt: 3 });
    await expect(uploadDocument(memory.deps, request({ files: jpegs(5) }))).rejects.toThrow('S3 lỗi giả lập');
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
    await expect(uploadDocument(failingCommit, request({ files: jpegs(3) }))).rejects.toThrow('commit lỗi');
    expect(memory.objects.size).toBe(0);
  });
});
