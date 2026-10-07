import { describe, expect, it } from 'vitest';
import {
  MAX_FILES_PER_PICK,
  nextQueued,
  planUpload,
  summarizeQueue,
  uploadQueueReducer,
  type UploadItem,
} from './uploadQueue';

const file = (name: string, type = 'image/jpeg', size = 1024) => ({ name, type, size }) as File;
let n = 0;
const newId = () => `item-${++n}`;
const add = (state: UploadItem[], files: File[]) => {
  const planned = planUpload(files, newId);
  if (!planned.ok) throw new Error('plan');
  return uploadQueueReducer(state, { type: 'add', items: planned.items });
};
const submit = (state: UploadItem[]) =>
  uploadQueueReducer(state, { type: 'submit', profileId: 'me', declaredType: 'prescription' });

describe('Hàng đợi tải ảnh: giữ ở trình duyệt, chỉ gửi khi bấm Xong', () => {
  it('ảnh hợp lệ ở trạng thái ready (chưa gửi), tệp lỗi bị loại ngay (TC-024)', () => {
    const state = add(
      [],
      [file('a.jpg'), file('hen.pdf', 'application/pdf'), file('b.jpg', 'image/jpeg', 11 << 20)],
    );
    expect(state.map((item) => [item.file.name, item.status, item.problem])).toEqual([
      ['a.jpg', 'ready', null],
      ['hen.pdf', 'rejected', 'unsupported'],
      ['b.jpg', 'rejected', 'too_large'],
    ]);
    expect(nextQueued(state)).toBeUndefined();
    expect(summarizeQueue(state)).toMatchObject({ ready: 1, total: 1, active: 0, rejected: 2 });
  });
  it(`chọn quá ${MAX_FILES_PER_PICK} tệp một lần bị từ chối toàn bộ (TC-023)`, () => {
    expect(MAX_FILES_PER_PICK).toBe(10);
    const files = Array.from({ length: MAX_FILES_PER_PICK + 1 }, (_, i) => file(`${i}.jpg`));
    expect(planUpload(files, newId)).toEqual({ ok: false, reason: 'too_many' });
    expect(planUpload(files.slice(1), newId)).toMatchObject({ ok: true });
  });
  it('bấm Xong gắn hồ sơ/loại lúc gửi cho mọi ảnh ready rồi chuyển queued', () => {
    const state = submit(add([], [file('a.jpg'), file('b.jpg'), file('x.pdf', 'application/pdf')]));
    expect(state.map((item) => [item.status, item.profileId, item.declaredType])).toEqual([
      ['queued', 'me', 'prescription'],
      ['queued', 'me', 'prescription'],
      ['rejected', null, null],
    ]);
    expect(nextQueued(state)?.file.name).toBe('a.jpg');
  });
  it('chuỗi queued → uploading → done/failed, thử lại đưa tệp lỗi về hàng đợi', () => {
    let state = submit(add([], [file('a.jpg'), file('b.jpg')]));
    const [a, b] = state;
    state = uploadQueueReducer(state, { type: 'start', id: a!.id });
    expect(nextQueued(state)).toBeUndefined();
    state = uploadQueueReducer(state, { type: 'progress', id: a!.id, percent: 64 });
    expect(state[0]).toMatchObject({ status: 'uploading', progress: 64 });
    state = uploadQueueReducer(state, { type: 'done', id: a!.id, documentId: 'doc-a' });
    state = uploadQueueReducer(state, { type: 'start', id: b!.id });
    state = uploadQueueReducer(state, { type: 'fail', id: b!.id, message: 'Mất kết nối' });
    expect(summarizeQueue(state)).toEqual({
      ready: 0,
      total: 2,
      done: 1,
      active: 0,
      failed: 1,
      rejected: 0,
      firstDocumentId: 'doc-a',
    });
    state = uploadQueueReducer(state, { type: 'retry' });
    expect(state[1]).toMatchObject({ status: 'queued', attempt: 1, progress: 0, error: null });
  });
  it('ảnh thêm sau khi đã gửi vẫn ready, không tự gửi', () => {
    let state = submit(add([], [file('a.jpg')]));
    state = add(state, [file('c.jpg')]);
    expect(state.map((item) => item.status)).toEqual(['queued', 'ready']);
  });
  it('bỏ ảnh và xóa danh sách tệp bị loại', () => {
    let state = add([], [file('a.jpg'), file('x.pdf', 'application/pdf')]);
    state = uploadQueueReducer(state, { type: 'dismissRejected' });
    expect(state.map((item) => item.file.name)).toEqual(['a.jpg']);
    state = uploadQueueReducer(state, { type: 'remove', id: state[0]!.id });
    expect(state).toEqual([]);
  });
  it('tiến trình được kẹp trong 0–100', () => {
    let state = submit(add([], [file('a.jpg')]));
    const id = state[0]!.id;
    state = uploadQueueReducer(state, { type: 'start', id });
    expect(uploadQueueReducer(state, { type: 'progress', id, percent: 140 })[0]!.progress).toBe(100);
    expect(uploadQueueReducer(state, { type: 'progress', id, percent: -3 })[0]!.progress).toBe(0);
  });
});
