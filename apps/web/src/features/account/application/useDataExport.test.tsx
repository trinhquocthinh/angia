import type * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { CreateDataExport, FetchDataExportStatus } from '@src/features/account/application/ports';
import { useDataExport } from '@src/features/account/application/useDataExport';

const harness = vi.hoisted(() => ({
  states: [] as unknown[],
  cleanups: [] as Array<() => void>,
  refs: [] as Array<{ current: unknown }>,
  stateIdx: 0,
  refIdx: 0,
}));

vi.mock('react', async (original) => ({
  ...(await original<typeof React>()),
  useState: <T,>(initial: T) => {
    const idx = harness.stateIdx++;
    if (harness.states.length <= idx) harness.states.push(initial);
    const set = (next: T | ((prev: T) => T)) => {
      const prev = harness.states[idx] as T;
      harness.states[idx] = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
    };
    return [harness.states[idx] as T, set];
  },
  useRef: <T,>(initial: T) => {
    const idx = harness.refIdx++;
    if (harness.refs.length <= idx) harness.refs.push({ current: initial });
    return harness.refs[idx] as { current: T };
  },
  useEffect: (effect: () => void | (() => void)) => {
    const cleanup = effect();
    if (typeof cleanup === 'function') harness.cleanups.push(cleanup);
  },
}));

beforeEach(() => {
  vi.useFakeTimers();
  harness.states.length = 0;
  harness.cleanups.length = 0;
  harness.refs.length = 0;
  harness.stateIdx = 0;
  harness.refIdx = 0;
});

afterEach(() => {
  for (const cleanup of harness.cleanups) cleanup();
  vi.useRealTimers();
});

function mount(createExport: CreateDataExport, fetchStatus: FetchDataExportStatus, pollIntervalMs = 2000) {
  let model!: ReturnType<typeof useDataExport>;
  function Probe() {
    harness.stateIdx = 0;
    harness.refIdx = 0;
    model = useDataExport({ csrfToken: 'csrf-exp', createExport, fetchStatus, pollIntervalMs });
    return null;
  }
  const rerender = () => {
    renderToStaticMarkup(<Probe />);
    return model;
  };
  return { rerender, model: rerender() };
}

it('TC-819: tải self chuyển idle -> pending -> ready và tạo đúng đường dẫn tệp ZIP', async () => {
  const createExport = vi.fn<CreateDataExport>().mockResolvedValue({ ok: true, data: { exportId: 'exp-1' } });
  const fetchStatus = vi
    .fn<FetchDataExportStatus>()
    .mockResolvedValueOnce({ ok: true, data: { status: 'pending', expiresAt: null } })
    .mockResolvedValueOnce({
      ok: true,
      data: { status: 'ready', expiresAt: '2026-11-24T12:00:00Z' },
    });
  const mounted = mount(createExport, fetchStatus);
  expect(mounted.model.phase).toBe('idle');
  expect(mounted.model.actionLabel).toBe('Tải dữ liệu của tôi');

  await mounted.model.startExport();
  expect(createExport).toHaveBeenCalledExactlyOnceWith('self', 'csrf-exp');
  expect(mounted.rerender().phase).toBe('pending');

  await vi.advanceTimersByTimeAsync(2000);
  expect(fetchStatus).toHaveBeenCalledTimes(1);
  expect(mounted.rerender().phase).toBe('pending');

  await vi.advanceTimersByTimeAsync(2000);
  expect(fetchStatus).toHaveBeenCalledTimes(2);
  const ready = mounted.rerender();
  expect(ready.phase).toBe('ready');
  expect(ready.downloadUrl).toBe('/api/me/data-exports/exp-1/file');
});

it('TC-820: chọn hồ sơ chưa liên kết đổi nhãn nút và gửi scope { profileId }', async () => {
  const createExport = vi.fn<CreateDataExport>().mockResolvedValue({ ok: true, data: { exportId: 'exp-2' } });
  const fetchStatus = vi.fn<FetchDataExportStatus>();
  const mounted = mount(createExport, fetchStatus);

  mounted.model.selectScope('prof-child');
  const updated = mounted.rerender();
  expect(updated.actionLabel).toBe('Tải dữ liệu hồ sơ');

  await updated.startExport();
  expect(createExport).toHaveBeenCalledExactlyOnceWith({ profileId: 'prof-child' }, 'csrf-exp');
});

it('TC-821: POST 404 hoặc trạng thái failed chuyển sang failed', async () => {
  const createExport = vi
    .fn<CreateDataExport>()
    .mockResolvedValueOnce({ ok: false, code: 'ERR_NOT_FOUND', status: 404 })
    .mockResolvedValueOnce({ ok: true, data: { exportId: 'exp-3' } });
  const fetchStatus = vi
    .fn<FetchDataExportStatus>()
    .mockResolvedValueOnce({ ok: true, data: { status: 'failed', expiresAt: null } });
  const mounted = mount(createExport, fetchStatus);

  await mounted.model.startExport();
  expect(mounted.rerender().phase).toBe('failed');

  await mounted.rerender().startExport();
  await vi.advanceTimersByTimeAsync(2000);
  expect(mounted.rerender().phase).toBe('failed');
});

it('ERR_RATE_LIMITED khi POST chuyển sang trạng thái rate_limited', async () => {
  const createExport = vi
    .fn<CreateDataExport>()
    .mockResolvedValue({ ok: false, code: 'ERR_RATE_LIMITED', status: 429 });
  const fetchStatus = vi.fn<FetchDataExportStatus>();
  const mounted = mount(createExport, fetchStatus);

  await mounted.model.startExport();
  expect(mounted.rerender().phase).toBe('rate_limited');
  expect(fetchStatus).not.toHaveBeenCalled();
});

it('dừng vòng lặp kiểm tra trạng thái khi unmount', async () => {
  const createExport = vi.fn<CreateDataExport>().mockResolvedValue({ ok: true, data: { exportId: 'exp-4' } });
  const fetchStatus = vi
    .fn<FetchDataExportStatus>()
    .mockResolvedValue({ ok: true, data: { status: 'pending', expiresAt: null } });
  const mounted = mount(createExport, fetchStatus);

  await mounted.model.startExport();
  for (const cleanup of harness.cleanups) cleanup();
  await vi.advanceTimersByTimeAsync(6000);
  expect(fetchStatus).not.toHaveBeenCalled();
});

it('TC-819: bấm đúp chỉ tạo một yêu cầu xuất dữ liệu', async () => {
  const createExport = vi.fn<CreateDataExport>().mockResolvedValue({ ok: true, data: { exportId: 'exp-5' } });
  const mounted = mount(createExport, vi.fn<FetchDataExportStatus>());
  await Promise.all([mounted.model.startExport(), mounted.model.startExport()]);
  expect(createExport).toHaveBeenCalledExactlyOnceWith('self', 'csrf-exp');
});

it('TC-819: phản hồi poll đến sau unmount không tạo timer tiếp', async () => {
  const createExport = vi.fn<CreateDataExport>().mockResolvedValue({ ok: true, data: { exportId: 'exp-6' } });
  let release!: (value: Awaited<ReturnType<FetchDataExportStatus>>) => void;
  const fetchStatus = vi.fn<FetchDataExportStatus>(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  const mounted = mount(createExport, fetchStatus);
  await mounted.model.startExport();
  vi.advanceTimersByTime(2000);
  for (const cleanup of harness.cleanups) cleanup();
  release({ ok: true, data: { status: 'pending', expiresAt: null } });
  await vi.advanceTimersByTimeAsync(6000);
  expect(fetchStatus).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
});
