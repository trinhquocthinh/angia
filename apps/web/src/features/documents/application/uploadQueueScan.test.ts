import { describe, expect, it } from 'vitest';
import type { PrivacyEdits } from '@angia/contracts';
import { redactionSource } from './redactionSource';
import { planUpload, uploadQueueReducer, type UploadItem } from './uploadQueue';

const original = { name: 'don.jpg', type: 'image/jpeg', size: 2048 } as File;
const scanned = { name: 'i1-scan.jpg', type: 'image/jpeg', size: 1024 } as File;
const EDITS: PrivacyEdits = {
  rotation: 90,
  crop: { left: 0, top: 0, width: 1_000_000, height: 1_000_000 },
  masks: [{ left: 0, top: 0, width: 10, height: 10 }],
};
const redacted = (): UploadItem[] => {
  const planned = planUpload([original], () => 'i1');
  if (!planned.ok) throw new Error('plan');
  const added = uploadQueueReducer([], {
    type: 'add',
    items: [{ ...planned.items[0]!, previewUrl: 'blob:orig' }],
  });
  return uploadQueueReducer(added, {
    type: 'redacted',
    id: 'i1',
    upload: { name: 'i1.jpg' } as File,
    edits: EDITS,
    sendToAi: true,
    thumbnailUrl: 'blob:thumb',
  });
};

describe('Ảnh nắn trong hàng đợi tải lên (SPEC-084)', () => {
  it('TC-914: nắn và bỏ nắn đều xoá vùng che, bản xuất cũ và đưa ảnh về chờ che; ảnh gốc giữ nguyên', () => {
    const state = uploadQueueReducer(redacted(), {
      type: 'scanned',
      id: 'i1',
      file: scanned,
      url: 'blob:scan',
    });
    expect(state[0]).toMatchObject({
      file: original,
      scan: { file: scanned, url: 'blob:scan' },
      status: 'needs_redaction',
      edits: null,
      upload: null,
      thumbnailUrl: null,
      sendToAi: null,
    });
    const back = uploadQueueReducer(state, { type: 'unscan', id: 'i1' });
    expect(back[0]).toMatchObject({ file: original, scan: null, status: 'needs_redaction', edits: null });
  });

  it('TC-914: ảnh đã gửi đi thì không nắn được nữa', () => {
    const queued = uploadQueueReducer(redacted(), { type: 'submit', profileId: 'p', declaredType: null });
    expect(uploadQueueReducer(queued, { type: 'scanned', id: 'i1', file: scanned, url: 'blob:scan' })).toBe(
      queued,
    );
  });

  it('TC-915: nguồn của trình che, bản xuất và gợi ý là ảnh nắn khi có, ngược lại là ảnh gốc', () => {
    const item = redacted()[0]!;
    expect(redactionSource(item)).toEqual({ file: original, url: 'blob:orig' });
    expect(redactionSource({ ...item, scan: { file: scanned, url: 'blob:scan' } })).toEqual({
      file: scanned,
      url: 'blob:scan',
    });
  });
});
