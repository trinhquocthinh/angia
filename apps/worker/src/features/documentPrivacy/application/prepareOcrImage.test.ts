import { createHash } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import { ImageConversionError } from '../../extraction/application/ImageConversionError.js';
import { prepareOcrImage } from './prepareOcrImage.js';
import { createPrivacyFixture, job } from './createPrivacyFixture.test-helper.js';
it('TC-186: render từ key gốc ngoài transaction, lưu SHA byte PNG; job lặp bỏ qua', async () => {
  const f = createPrivacyFixture();
  const original = f.deps.repository.withFamily;
  const hashes: string[] = [];
  f.deps.repository.withFamily = (family, work) =>
    original(family, (store) =>
      work({
        ...store,
        saveReady: async (id, draft, key, hash) => {
          hashes.push(hash);
          return store.saveReady(id, draft, key, hash);
        },
      }),
    );
  expect(await prepareOcrImage(f.deps, job)).toEqual({ status: 'ready' });
  expect(f.document.ocrImageKey).toBe('families/family/profiles/profile/documents/doc/ocr/draft/attempt.png');
  expect(hashes).toEqual([
    createHash('sha256')
      .update(new Uint8Array([2, 3]))
      .digest('hex'),
  ]);
  expect(f.objects.get('original')).toEqual(new Uint8Array([1]));
  expect(await prepareOcrImage(f.deps, job)).toEqual({ status: 'skipped' });
  expect(f.deps.images.toPng).toHaveBeenCalledOnce();
});
it('TC-187: job sai gia đình hoặc draft cũ không đọc S3', async () => {
  const f = createPrivacyFixture();
  for (const fields of [{ familyId: 'other' }, { draftId: 'old' }])
    expect(await prepareOcrImage(f.deps, { ...job, ...fields })).toEqual({ status: 'skipped' });
  expect(f.deps.storage.get).not.toHaveBeenCalled();
});
it('TC-188: lỗi ảnh đánh dấu draft failed, giữ awaiting_privacy và gốc; không gọi AI', async () => {
  const f = createPrivacyFixture();
  vi.mocked(f.deps.images.toPng).mockRejectedValue(new ImageConversionError());
  expect(await prepareOcrImage(f.deps, job)).toEqual({ status: 'failed', reason: 'image_unusable' });
  expect(f.document).toMatchObject({
    status: 'awaiting_privacy',
    privacyDraftStatus: 'failed',
    ocrImageKey: null,
  });
  expect(f.objects.size).toBe(1);
});
it('TC-189: S3 lỗi còn lượt thì retry, lượt cuối draft failed', async () => {
  const f = createPrivacyFixture();
  vi.mocked(f.deps.storage.get).mockRejectedValue(new Error('S3'));
  await expect(prepareOcrImage(f.deps, job)).rejects.toThrow('S3');
  expect(f.document.privacyDraftStatus).toBe('pending');
  expect(await prepareOcrImage(f.deps, { ...job, finalAttempt: true })).toEqual({
    status: 'failed',
    reason: 'prepare_failed',
  });
});
it('TC-190: CAS thua chọn nhập tay hoặc draft mới chỉ dọn object lượt này', async () => {
  for (const race of ['manual_entry', 'new_draft']) {
    const f = createPrivacyFixture();
    f.objects.set('other-attempt', new Uint8Array([9]));
    vi.mocked(f.deps.storage.put).mockImplementation(async (key, bytes) => {
      f.objects.set(key, bytes);
      if (race === 'manual_entry') f.document.status = 'manual_entry';
      else f.document.privacyDraftId = 'new';
      f.document.ocrImageKey = 'other-attempt';
    });
    expect(await prepareOcrImage(f.deps, job)).toEqual({ status: 'skipped' });
    expect(f.objects.size).toBe(2);
    expect(f.document.ocrImageKey).toBe('other-attempt');
  }
});
it('TC-191: commit mất phản hồi giữ object đã tham chiếu; reconcile không được thì giữ object và retry', async () => {
  const f = createPrivacyFixture();
  const original = f.deps.repository.withFamily;
  f.deps.repository.withFamily = (family, work) =>
    original(family, (store) =>
      work({
        ...store,
        saveReady: async (...args) => {
          await store.saveReady(...args);
          throw new Error('commit');
        },
      }),
    );
  expect(await prepareOcrImage(f.deps, job)).toEqual({ status: 'ready' });
  expect(f.deps.storage.delete).not.toHaveBeenCalled();
  const g = createPrivacyFixture();
  const read = g.deps.repository.withFamily;
  let calls = 0;
  g.deps.repository.withFamily = (family, work) => {
    if (++calls > 1) return Promise.reject(new Error('DB'));
    return read(family, work);
  };
  await expect(prepareOcrImage(g.deps, { ...job, finalAttempt: true })).rejects.toThrow('DB');
  expect(g.deps.storage.delete).not.toHaveBeenCalled();
  expect(g.objects.size).toBe(2);
});
it('TC-192: lỗi ảnh sau khi draft mới thắng không đánh dấu nhầm draft mới', async () => {
  const f = createPrivacyFixture();
  vi.mocked(f.deps.images.toPng).mockImplementation(async () => {
    f.document.privacyDraftId = 'new';
    throw new ImageConversionError();
  });
  expect(await prepareOcrImage(f.deps, job)).toEqual({ status: 'skipped' });
  expect(f.document.privacyDraftStatus).toBe('pending');
});
