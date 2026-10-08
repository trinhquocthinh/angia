import { expect, it, vi } from 'vitest';
import { ImageConversionError } from '../../extraction/application/ImageConversionError.js';
import { prepareDocumentPreview } from './prepareDocumentPreview.js';
import type { PreviewDependencies, PreviewDocument } from './ports.js';

function fixture() {
  const document: PreviewDocument = {
    id: 'doc',
    healthProfileId: 'profile',
    status: 'uploaded',
    originalKey: 'families/family/profiles/profile/documents/doc/original.heic',
    previewKey: null,
    mimeType: 'image/heic',
  };
  const original = new Uint8Array([1]);
  const objects = new Map<string, Uint8Array>([[document.originalKey, original]]);
  const deps: PreviewDependencies = {
    newId: () => 'attempt',
    images: { toWebp: vi.fn(async () => new Uint8Array([2])) },
    storage: {
      get: vi.fn(async (key) => objects.get(key)!),
      put: vi.fn(async (key, bytes) => {
        objects.set(key, bytes);
      }),
      delete: vi.fn(async (key) => {
        objects.delete(key);
      }),
    },
    repository: {
      withFamily: async (family, work) =>
        work({
          findDocument: async () => (family === 'family' ? { ...document } : null),
          savePreview: async (_id, key) => {
            if (document.status !== 'uploaded') return false;
            document.status = 'awaiting_privacy';
            document.previewKey = key;
            return true;
          },
          markManualEntry: async () => {
            if (document.status !== 'uploaded') return false;
            document.status = 'manual_entry';
            return true;
          },
        }),
    },
  };
  return { deps, document, objects, original };
}
const job = { documentId: 'doc', familyId: 'family', finalAttempt: false };

it('TC-144: chuẩn bị preview → awaiting_privacy, giữ ảnh gốc; job lặp không ghi lại', async () => {
  const f = fixture();
  expect(await prepareDocumentPreview(f.deps, job)).toEqual({ status: 'awaiting_privacy' });
  expect(f.document.previewKey).toBe('families/family/profiles/profile/documents/doc/previews/attempt.webp');
  expect(f.objects.get(f.document.originalKey)).toBe(f.original);
  expect(await prepareDocumentPreview(f.deps, job)).toEqual({ status: 'skipped' });
  expect(f.deps.storage.put).toHaveBeenCalledOnce();
});
it('TC-145: job khác gia đình → bỏ qua trước S3/decode', async () => {
  const f = fixture();
  expect(await prepareDocumentPreview(f.deps, { ...job, familyId: 'other' })).toEqual({ status: 'skipped' });
  expect(f.deps.storage.get).not.toHaveBeenCalled();
  expect(f.deps.images.toWebp).not.toHaveBeenCalled();
});
it('TC-146: lỗi ảnh → nhập tay ngay, giữ ảnh gốc', async () => {
  const f = fixture();
  vi.mocked(f.deps.images.toWebp).mockRejectedValue(new ImageConversionError());
  expect(await prepareDocumentPreview(f.deps, job)).toEqual({
    status: 'manual_entry',
    reason: 'image_unusable',
  });
  expect(f.document.status).toBe('manual_entry');
  expect(f.objects.has(f.document.originalKey)).toBe(true);
});
it('TC-147: lỗi S3 retry, lượt cuối nhập tay', async () => {
  const f = fixture();
  vi.mocked(f.deps.storage.get).mockRejectedValue(new Error('storage'));
  await expect(prepareDocumentPreview(f.deps, job)).rejects.toThrow('storage');
  expect(f.document.status).toBe('uploaded');
  expect(await prepareDocumentPreview(f.deps, { ...job, finalAttempt: true })).toEqual({
    status: 'manual_entry',
    reason: 'preview_failed',
  });
});

it('TC-148: cạnh tranh cập nhật → không ghi đè trạng thái, xóa preview riêng của lượt thua', async () => {
  const f = fixture();
  vi.mocked(f.deps.storage.put).mockImplementation(async (key, bytes) => {
    f.objects.set(key, bytes);
    f.document.status = 'awaiting_privacy';
    f.document.previewKey = 'other-preview';
  });
  expect(await prepareDocumentPreview(f.deps, job)).toEqual({ status: 'skipped' });
  expect(f.document.previewKey).toBe('other-preview');
  expect(f.deps.storage.delete).toHaveBeenCalledOnce();
});
it('TC-149: mất phản hồi commit sau khi lưu → đọc lại và giữ preview được tham chiếu', async () => {
  const f = fixture();
  const original = f.deps.repository.withFamily;
  f.deps.repository.withFamily = (family, work) =>
    original(family, (store) =>
      work({
        ...store,
        savePreview: async (id, key) => {
          await store.savePreview(id, key);
          throw new Error('mất phản hồi commit');
        },
      }),
    );
  expect(await prepareDocumentPreview(f.deps, job)).toEqual({ status: 'awaiting_privacy' });
  expect(f.deps.storage.delete).not.toHaveBeenCalled();
  expect(f.objects.has(f.document.previewKey!)).toBe(true);
});

it('TC-158: không xác minh được commit → giữ object để không xóa ảnh có thể đang được tham chiếu', async () => {
  const f = fixture();
  const original = f.deps.repository.withFamily;
  let calls = 0;
  f.deps.repository.withFamily = (family, work) => {
    if (++calls >= 2) throw new Error('DB mất kết nối');
    return original(family, work);
  };
  await expect(prepareDocumentPreview(f.deps, job)).rejects.toThrow('DB mất kết nối');
  expect(f.deps.storage.delete).not.toHaveBeenCalled();
  expect(f.objects.size).toBe(2);
});
