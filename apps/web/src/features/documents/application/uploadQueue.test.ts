import { describe, expect, it } from 'vitest';
import {
  MAX_FILES_PER_PICK,
  nextQueued,
  planUpload,
  summarizeQueue,
  uploadQueueReducer,
} from './uploadQueue';

const file = (name: string, type = 'image/jpeg', size = 1024) => ({ name, type, size }) as File;
let n = 0;
const newId = () => `item-${++n}`;
const plan = (files: File[]) => planUpload(files, { profileId: 'me', declaredType: null }, newId);

describe('Hàng đợi tải ảnh: chọn nhiều, gửi lần lượt từng ảnh', () => {
  it('ảnh hợp lệ vào hàng đợi, tệp lỗi bị loại ngay nhưng không chặn ảnh khác (TC-024)', () => {
    const result = plan([
      file('a.jpg'),
      file('hen.pdf', 'application/pdf'),
      file('b.jpg', 'image/jpeg', 11 << 20),
    ]);
    expect(result.ok && result.items.map((item) => [item.file.name, item.status, item.problem])).toEqual([
      ['a.jpg', 'queued', null],
      ['hen.pdf', 'rejected', 'unsupported'],
      ['b.jpg', 'rejected', 'too_large'],
    ]);
  });
  it(`chọn quá ${MAX_FILES_PER_PICK} tệp một lần bị từ chối toàn bộ (TC-023)`, () => {
    const files = Array.from({ length: MAX_FILES_PER_PICK + 1 }, (_, i) => file(`${i}.jpg`));
    expect(plan(files)).toEqual({ ok: false, reason: 'too_many' });
    expect(plan(files.slice(1))).toMatchObject({ ok: true });
  });
  it('chuỗi trạng thái queued → uploading → done/failed, thử lại đưa tệp lỗi về hàng đợi', () => {
    const planned = plan([file('a.jpg'), file('b.jpg')]);
    if (!planned.ok) throw new Error('plan');
    let state = uploadQueueReducer([], { type: 'add', items: planned.items });
    const [a, b] = planned.items;
    expect(nextQueued(state)?.id).toBe(a!.id);
    state = uploadQueueReducer(state, { type: 'start', id: a!.id });
    expect(nextQueued(state)).toBeUndefined();
    state = uploadQueueReducer(state, { type: 'progress', id: a!.id, percent: 64 });
    expect(state[0]).toMatchObject({ status: 'uploading', progress: 64 });
    state = uploadQueueReducer(state, { type: 'done', id: a!.id });
    state = uploadQueueReducer(state, { type: 'start', id: b!.id });
    state = uploadQueueReducer(state, { type: 'fail', id: b!.id, message: 'Mất kết nối' });
    expect(summarizeQueue(state)).toEqual({ total: 2, done: 1, active: 0, failed: 1, rejected: 0 });
    state = uploadQueueReducer(state, { type: 'retry' });
    expect(state[1]).toMatchObject({ status: 'queued', attempt: 1, progress: 0, error: null });
  });
  it('bỏ tệp và xóa danh sách tệp bị loại', () => {
    const planned = plan([file('a.jpg'), file('x.pdf', 'application/pdf')]);
    if (!planned.ok) throw new Error('plan');
    let state = uploadQueueReducer([], { type: 'add', items: planned.items });
    state = uploadQueueReducer(state, { type: 'dismissRejected' });
    expect(state.map((item) => item.file.name)).toEqual(['a.jpg']);
    state = uploadQueueReducer(state, { type: 'remove', id: state[0]!.id });
    expect(state).toEqual([]);
  });
  it('tiến trình được kẹp trong 0–100', () => {
    const planned = plan([file('a.jpg')]);
    if (!planned.ok) throw new Error('plan');
    const id = planned.items[0]!.id;
    let state = uploadQueueReducer([], { type: 'add', items: planned.items });
    state = uploadQueueReducer(state, { type: 'start', id });
    expect(uploadQueueReducer(state, { type: 'progress', id, percent: 140 })[0]!.progress).toBe(100);
    expect(uploadQueueReducer(state, { type: 'progress', id, percent: -3 })[0]!.progress).toBe(0);
  });
});
