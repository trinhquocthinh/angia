import { describe, expect, it } from 'vitest';
import type { PrivacyEdits } from '@angia/contracts';
import {
  MAX_FILES_PER_PICK,
  nextBatch,
  planUpload,
  shouldWarnOnLeave,
  summarizeQueue,
  uploadQueueReducer,
  type UploadItem,
} from './uploadQueue';

const file = (name: string, type = 'image/jpeg', size = 1024) => ({ name, type, size }) as File;
const EDITS: PrivacyEdits = {
  rotation: 0,
  crop: { left: 0, top: 0, width: 1_000_000, height: 1_000_000 },
  masks: [{ left: 0, top: 0, width: 100_000, height: 100_000 }],
};
let n = 0;
const newId = () => `item-${++n}`;
const plan = (state: UploadItem[], files: File[]) => {
  const planned = planUpload(files, newId);
  if (!planned.ok) throw new Error('plan');
  return uploadQueueReducer(state, { type: 'add', items: planned.items });
};
// Thêm ảnh rồi giả lập bước che xong (bản gửi là JPEG đã xuất).
const add = (state: UploadItem[], files: File[], sendToAi = false) => {
  const planned = plan(state, files);
  return planned.reduce(
    (current, item) =>
      item.status === 'needs_redaction'
        ? uploadQueueReducer(current, {
            type: 'redacted',
            id: item.id,
            upload: file(`${item.id}.jpg`),
            edits: EDITS,
            sendToAi,
            thumbnailUrl: `blob:${item.id}`,
          })
        : current,
    planned,
  );
};
const submit = (state: UploadItem[]) =>
  uploadQueueReducer(state, { type: 'submit', profileId: 'me', declaredType: 'prescription' });
const ids = (state: UploadItem[]) => state.map((item) => item.id);

describe('Hàng đợi tải ảnh: che trên máy, chỉ gửi khi bấm Xong', () => {
  it('TC-429 ảnh hợp lệ vào needs_redaction; tệp lỗi bị loại ngay (TC-024)', () => {
    const state = plan(
      [],
      [file('a.jpg'), file('hen.pdf', 'application/pdf'), file('b.jpg', 'image/jpeg', 31 << 20)],
    );
    expect(state.map((item) => [item.file.name, item.status, item.problem])).toEqual([
      ['a.jpg', 'needs_redaction', null],
      ['hen.pdf', 'rejected', 'unsupported'],
      ['b.jpg', 'rejected', 'too_large'],
    ]);
    expect(state[0]).toMatchObject({ upload: null, edits: null, sendToAi: null });
    expect(summarizeQueue(state)).toMatchObject({ needsRedaction: 1, ready: 0, total: 1, rejected: 2 });
  });

  it('TC-429 redacted → ready mang upload, edits, sendToAi và ảnh thu nhỏ của bản đã xuất', () => {
    const state = plan([], [file('a.jpg')]);
    const upload = file('x.jpg');
    const ready = uploadQueueReducer(state, {
      type: 'redacted',
      id: state[0]!.id,
      upload,
      edits: EDITS,
      sendToAi: true,
      thumbnailUrl: 'blob:x',
    });
    expect(ready[0]).toMatchObject({
      status: 'ready',
      upload,
      edits: EDITS,
      sendToAi: true,
      thumbnailUrl: 'blob:x',
    });
    expect(summarizeQueue(ready)).toMatchObject({ needsRedaction: 0, ready: 1, aiReady: 1 });
  });

  it('TC-429 submit bị bỏ qua khi còn ảnh chưa che', () => {
    const state = plan(add([], [file('a.jpg')]), [file('b.jpg')]);
    expect(submit(state)).toBe(state);
  });

  it('TC-429 mở lại ảnh đã che: về needs_redaction, giữ edits để chỉnh tiếp, bỏ bản xuất cũ', () => {
    const state = add([], [file('a.jpg')], true);
    const reopened = uploadQueueReducer(state, { type: 'reopen', id: state[0]!.id });
    expect(reopened[0]).toMatchObject({
      status: 'needs_redaction',
      edits: EDITS,
      upload: null,
      thumbnailUrl: null,
    });
    const queued = submit(state);
    expect(uploadQueueReducer(queued, { type: 'reopen', id: queued[0]!.id })).toEqual(queued);
  });

  it(`chọn quá ${MAX_FILES_PER_PICK} tệp một lần bị từ chối toàn bộ (TC-023)`, () => {
    expect(MAX_FILES_PER_PICK).toBe(10);
    const files = Array.from({ length: MAX_FILES_PER_PICK + 1 }, (_, i) => file(`${i}.jpg`));
    expect(planUpload(files, newId)).toEqual({ ok: false, reason: 'too_many' });
    expect(planUpload(files.slice(1), newId)).toMatchObject({ ok: true });
  });

  it('bấm Xong gắn hồ sơ/loại cho mọi ảnh ready; cả lô gửi chung một request', () => {
    const state = submit(add([], [file('a.jpg'), file('b.jpg'), file('x.pdf', 'application/pdf')]));
    expect(state.map((item) => [item.status, item.profileId, item.declaredType])).toEqual([
      ['queued', 'me', 'prescription'],
      ['queued', 'me', 'prescription'],
      ['rejected', null, null],
    ]);
    expect(nextBatch(state).map((item) => item.file.name)).toEqual(['a.jpg', 'b.jpg']);
  });

  it(`hơn ${MAX_FILES_PER_PICK} ảnh từ nhiều lần chọn được chia lô ≤ ${MAX_FILES_PER_PICK}, gửi lần lượt`, () => {
    const pick = (prefix: string) => Array.from({ length: 8 }, (_, i) => file(`${prefix}${i}.jpg`));
    let state = submit(add(add([], pick('a')), pick('b')));
    const first = nextBatch(state);
    expect(first).toHaveLength(MAX_FILES_PER_PICK);
    state = uploadQueueReducer(state, { type: 'start', ids: ids(first) });
    expect(nextBatch(state)).toEqual([]);
    state = first.reduce(
      (current, item) => uploadQueueReducer(current, { type: 'done', id: item.id, documentId: item.id }),
      state,
    );
    expect(nextBatch(state)).toHaveLength(6);
  });

  it('TC-432 lô lỗi rồi thử lại giữ đúng tệp đã xuất và lựa chọn sendToAi (không xuất lại)', () => {
    let state = submit(add([], [file('a.jpg'), file('b.jpg')], true));
    const [a, b] = state;
    state = uploadQueueReducer(state, { type: 'start', ids: [a!.id, b!.id] });
    state = uploadQueueReducer(state, { type: 'progress', ids: [a!.id, b!.id], percent: 64 });
    expect(state.map((item) => [item.status, item.progress])).toEqual([
      ['uploading', 64],
      ['uploading', 64],
    ]);
    state = uploadQueueReducer(state, { type: 'done', id: a!.id, documentId: 'doc-a' });
    state = uploadQueueReducer(state, { type: 'fail', ids: [b!.id], message: 'Mất kết nối' });
    expect(summarizeQueue(state)).toEqual({
      needsRedaction: 0,
      ready: 0,
      aiReady: 0,
      total: 2,
      done: 1,
      active: 0,
      failed: 1,
      rejected: 0,
      firstDocumentId: 'doc-a',
    });
    state = uploadQueueReducer(state, { type: 'retry' });
    expect(state[1]).toMatchObject({
      status: 'queued',
      attempt: 1,
      progress: 0,
      error: null,
      sendToAi: true,
    });
    expect(state[1]!.upload).toBe(b!.upload);
    expect(nextBatch(state)[0]!.upload).toBe(b!.upload);
  });

  it('TC-432 cảnh báo rời trang khi còn ảnh chưa che, đã che chưa gửi hoặc đang gửi', () => {
    const empty = summarizeQueue([]);
    expect(shouldWarnOnLeave(empty)).toBe(false);
    expect(shouldWarnOnLeave(summarizeQueue(plan([], [file('a.jpg')])))).toBe(true);
    expect(shouldWarnOnLeave(summarizeQueue(add([], [file('a.jpg')])))).toBe(true);
    expect(shouldWarnOnLeave(summarizeQueue(submit(add([], [file('a.jpg')]))))).toBe(true);
    const done = submit(add([], [file('a.jpg')]));
    const sent = uploadQueueReducer(done, { type: 'done', id: done[0]!.id, documentId: 'd' });
    expect(shouldWarnOnLeave(summarizeQueue(sent))).toBe(false);
  });

  it('ảnh thêm sau khi đã gửi chờ che, không tự gửi', () => {
    let state = submit(add([], [file('a.jpg')]));
    state = plan(state, [file('c.jpg')]);
    expect(state.map((item) => item.status)).toEqual(['queued', 'needs_redaction']);
  });

  it('bỏ ảnh và xóa danh sách tệp bị loại; kết quả che của ảnh đã bỏ bị bỏ qua', () => {
    let state = plan([], [file('a.jpg'), file('x.pdf', 'application/pdf')]);
    const id = state[0]!.id;
    state = uploadQueueReducer(state, { type: 'dismissRejected' });
    expect(state.map((item) => item.file.name)).toEqual(['a.jpg']);
    state = uploadQueueReducer(state, { type: 'remove', id });
    const late = {
      type: 'redacted' as const,
      id,
      upload: file('a.jpg'),
      edits: EDITS,
      sendToAi: false,
      thumbnailUrl: 'blob:a',
    };
    expect(uploadQueueReducer(state, late)).toEqual([]);
  });

  it('tiến trình được kẹp trong 0–100', () => {
    let state = submit(add([], [file('a.jpg')]));
    const batch = ids(state);
    state = uploadQueueReducer(state, { type: 'start', ids: batch });
    expect(uploadQueueReducer(state, { type: 'progress', ids: batch, percent: 140 })[0]!.progress).toBe(100);
    expect(uploadQueueReducer(state, { type: 'progress', ids: batch, percent: -3 })[0]!.progress).toBe(0);
  });

  it('TC-108: máy chủ bận → cả lô vẫn đang gửi (khóa hàng đợi) kèm lời nhắn; gửi lại thì xóa lời nhắn', () => {
    let state = submit(add([], [file('a.jpg'), file('b.jpg')]));
    const batch = ids(state);
    state = uploadQueueReducer(state, { type: 'start', ids: batch });
    state = uploadQueueReducer(state, { type: 'progress', ids: batch, percent: 40 });
    const message = 'Máy chủ bận · tự thử lại sau 9 giây';
    state = uploadQueueReducer(state, { type: 'wait', ids: batch, message });
    expect(state[1]).toMatchObject({ status: 'uploading', progress: 0, notice: message });
    expect(nextBatch(state)).toEqual([]);
    state = uploadQueueReducer(state, { type: 'start', ids: batch });
    expect(state[0]!.notice).toBeNull();
  });
});
