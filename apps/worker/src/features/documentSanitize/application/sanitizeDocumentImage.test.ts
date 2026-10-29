import { expect, it, vi } from 'vitest';
import { ImageConversionError } from '../../extraction/application/ImageConversionError.js';
import { createMemorySanitizeDeps } from '../../../shared/test/createMemorySanitizeDeps.test-helper.js';
import { sanitizeDocumentImage } from './sanitizeDocumentImage.js';

const job = { documentId: 'doc', familyId: 'family', finalAttempt: false };
const newKey = 'families/family/profiles/profile/documents/doc/images/attempt.jpg';

it.each([true, false])(
  'TC-416: receipt=%s chọn đúng trạng thái, dọn sau CAS và chạy lặp an toàn',
  async (approved) => {
    const f = createMemorySanitizeDeps(approved);
    vi.mocked(f.deps.storage.delete).mockImplementation(async (key) => {
      expect(f.document()?.imageKey).toBe(newKey);
      expect(f.purges.has(key)).toBe(true);
      f.objects.delete(key);
    });
    expect(await sanitizeDocumentImage(f.deps, job)).toEqual({
      status: approved ? 'extracting' : 'manual_entry',
    });
    expect(f.store.saveSanitized).toHaveBeenCalledWith('doc', {
      oldKey: f.oldKey,
      key: newKey,
      sha256: 'a'.repeat(64),
      sizeBytes: 1,
    });
    expect(f.objects.has(f.oldKey)).toBe(false);
    expect(await sanitizeDocumentImage(f.deps, job)).toEqual({ status: 'skipped' });
    expect(f.deps.images.sanitize).toHaveBeenCalledOnce();
  },
);

it('TC-417: ảnh hỏng đặt cặp ảnh NULL, nhập tay và giữ ý định dọn khi S3 lỗi', async () => {
  const f = createMemorySanitizeDeps();
  vi.mocked(f.deps.images.sanitize).mockRejectedValue(new ImageConversionError());
  vi.mocked(f.deps.storage.delete).mockRejectedValue(new Error('S3'));
  expect(await sanitizeDocumentImage(f.deps, job)).toEqual({
    status: 'manual_entry',
    reason: 'image_unusable',
  });
  expect(f.document()).toMatchObject({ imageKey: null, status: 'manual_entry' });
  expect(f.purges.has(f.oldKey)).toBe(true);
});

it.each([false, true])(
  'TC-417: lỗi hạ tầng không xóa ảnh hoặc đổi trạng thái, finalAttempt=%s',
  async (finalAttempt) => {
    const f = createMemorySanitizeDeps();
    vi.mocked(f.deps.storage.get).mockRejectedValue(new Error('S3'));
    await expect(sanitizeDocumentImage(f.deps, { ...job, finalAttempt })).rejects.toThrow('S3');
    expect(f.store.markUnusable).not.toHaveBeenCalled();
    expect(f.deps.storage.delete).not.toHaveBeenCalled();
  },
);

it('TC-418: chứng từ biến mất giữa xử lý, ghi ý định dọn khóa mới rồi skipped', async () => {
  const f = createMemorySanitizeDeps();
  vi.mocked(f.deps.storage.put).mockImplementation(async (key, bytes) => {
    f.objects.set(key, bytes);
    f.removeDocument();
  });
  expect(await sanitizeDocumentImage(f.deps, job)).toEqual({ status: 'skipped' });
  expect(f.objects.has(newKey)).toBe(false);
  expect(f.purges.has(newKey)).toBe(true);
});

it('TC-418: mất phản hồi COMMIT giữ ảnh mới, vẫn dọn khóa cũ', async () => {
  const f = createMemorySanitizeDeps();
  const save = f.store.saveSanitized;
  f.store.saveSanitized = async (...args) => {
    await save(...args);
    throw new Error('COMMIT');
  };
  expect(await sanitizeDocumentImage(f.deps, job)).toEqual({ status: 'extracting' });
  expect(f.objects.has(newKey)).toBe(true);
  expect(f.objects.has(f.oldKey)).toBe(false);
});

it('TC-418: không đọc lại được COMMIT thì giữ khóa mới và ném lỗi', async () => {
  const f = createMemorySanitizeDeps();
  vi.mocked(f.store.saveSanitized).mockRejectedValue(new Error('DB'));
  vi.mocked(f.store.findDocument).mockResolvedValueOnce(f.document()).mockRejectedValue(new Error('DB'));
  await expect(sanitizeDocumentImage(f.deps, job)).rejects.toThrow('DB');
  expect(f.objects.has(newKey)).toBe(true);
  expect(f.deps.storage.delete).not.toHaveBeenCalled();
});

it('TC-418: PUT thành công nhưng mất phản hồi, vẫn ghi ý định dọn và retry', async () => {
  const f = createMemorySanitizeDeps();
  vi.mocked(f.deps.storage.put).mockImplementation(async (key, bytes) => {
    f.objects.set(key, bytes);
    throw new Error('S3');
  });
  await expect(sanitizeDocumentImage(f.deps, job)).rejects.toThrow('S3');
  expect(f.purges.has(newKey)).toBe(true);
  expect(f.objects.has(newKey)).toBe(false);
  expect(f.store.markUnusable).not.toHaveBeenCalled();
});

it('TC-418: khác gia đình hoặc khóa nằm ngoài chứng từ thì không đọc S3', async () => {
  const f = createMemorySanitizeDeps();
  expect(await sanitizeDocumentImage(f.deps, { ...job, familyId: 'other' })).toEqual({ status: 'skipped' });
  f.document()!.imageKey = 'families/other/upload.jpg';
  await expect(sanitizeDocumentImage(f.deps, job)).rejects.toThrow('invalid_image_key');
  expect(f.deps.storage.get).not.toHaveBeenCalled();
});

it('TC-418: lượt cạnh tranh đã lưu ảnh khác thì chỉ dọn ảnh của lượt thua', async () => {
  const f = createMemorySanitizeDeps();
  const winnerKey = 'families/family/profiles/profile/documents/doc/images/winner.jpg';
  vi.mocked(f.deps.storage.put).mockImplementation(async (key, bytes) => {
    f.objects.set(key, bytes);
    f.objects.set(winnerKey, bytes);
    Object.assign(f.document()!, { status: 'extracting', imageKey: winnerKey });
  });
  expect(await sanitizeDocumentImage(f.deps, job)).toEqual({ status: 'skipped' });
  expect(f.objects.has(winnerKey)).toBe(true);
  expect(f.objects.has(newKey)).toBe(false);
  expect(f.purges.has(newKey)).toBe(true);
});
