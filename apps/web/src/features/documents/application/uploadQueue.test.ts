import { describe, expect, it } from 'vitest';
import {
  MAX_FILES_PER_PICK,
  nextBatch,
  nextPreparing,
  planUpload,
  summarizeQueue,
  uploadQueueReducer,
  type UploadItem,
} from './uploadQueue';

const file = (name: string, type = 'image/jpeg', size = 1024) => ({ name, type, size }) as File;
let n = 0;
const newId = () => `item-${++n}`;
const plan = (state: UploadItem[], files: File[]) => {
  const planned = planUpload(files, newId);
  if (!planned.ok) throw new Error('plan');
  return uploadQueueReducer(state, { type: 'add', items: planned.items });
};
// Thêm ảnh rồi giả lập bước nén xong (bản gửi = tệp gốc).
const add = (state: UploadItem[], files: File[]) => {
  const planned = plan(state, files);
  return planned.reduce(
    (current, item) =>
      item.status === 'preparing'
        ? uploadQueueReducer(current, { type: 'prepared', id: item.id, upload: item.file })
        : current,
    planned,
  );
};
const submit = (state: UploadItem[]) =>
  uploadQueueReducer(state, { type: 'submit', profileId: 'me', declaredType: 'prescription' });
const ids = (state: UploadItem[]) => state.map((item) => item.id);

describe('Hàng đợi tải ảnh: nén trên trình duyệt, chỉ gửi khi bấm Xong', () => {
  it('ảnh hợp lệ chờ nén (preparing) rồi ready; tệp lỗi bị loại ngay (TC-024)', () => {
    const state = plan(
      [],
      [file('a.jpg'), file('hen.pdf', 'application/pdf'), file('b.jpg', 'image/jpeg', 31 << 20)],
    );
    expect(state.map((item) => [item.file.name, item.status, item.problem])).toEqual([
      ['a.jpg', 'preparing', null],
      ['hen.pdf', 'rejected', 'unsupported'],
      ['b.jpg', 'rejected', 'too_large'],
    ]);
    expect(nextPreparing(state)?.file.name).toBe('a.jpg');
    expect(summarizeQueue(state)).toMatchObject({ preparing: 1, ready: 0, total: 1, rejected: 2 });
    const compressed = file('a.jpg', 'image/jpeg', 512);
    const ready = uploadQueueReducer(state, { type: 'prepared', id: state[0]!.id, upload: compressed });
    expect(ready[0]).toMatchObject({ status: 'ready', upload: compressed });
    expect(nextPreparing(ready)).toBeUndefined();
  });
  it('ảnh trình duyệt không nén được mà vẫn > 10 MiB bị loại sau bước chuẩn bị', () => {
    const state = plan([], [file('IMG_1.heic', '', 12 << 20)]);
    const rejected = uploadQueueReducer(state, {
      type: 'reject',
      id: state[0]!.id,
      problem: 'not_compressible',
    });
    expect(rejected[0]).toMatchObject({ status: 'rejected', problem: 'not_compressible' });
    expect(summarizeQueue(rejected)).toMatchObject({ preparing: 0, total: 0, rejected: 1 });
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
  it('chuỗi queued → uploading → done/failed theo lô, thử lại đưa tệp lỗi về hàng đợi', () => {
    let state = submit(add([], [file('a.jpg'), file('b.jpg')]));
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
      preparing: 0,
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
  it('bỏ ảnh và xóa danh sách tệp bị loại; kết quả nén của ảnh đã bỏ bị bỏ qua', () => {
    let state = plan([], [file('a.jpg'), file('x.pdf', 'application/pdf')]);
    const id = state[0]!.id;
    state = uploadQueueReducer(state, { type: 'dismissRejected' });
    expect(state.map((item) => item.file.name)).toEqual(['a.jpg']);
    state = uploadQueueReducer(state, { type: 'remove', id });
    expect(uploadQueueReducer(state, { type: 'prepared', id, upload: file('a.jpg') })).toEqual([]);
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
