import type * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';
import type { SubmitAccountDeletion } from '@src/features/account/application/ports';
import { useAccountDeletion } from '@src/features/account/application/useAccountDeletion';

const harness = vi.hoisted(() => ({
  states: [] as unknown[],
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
}));

beforeEach(() => {
  harness.states.length = 0;
  harness.refs.length = 0;
  harness.stateIdx = 0;
  harness.refIdx = 0;
});

function mount(
  hasLinkedProfile: boolean,
  submitDeletion: SubmitAccountDeletion,
  onDeleted = vi.fn(async () => {}),
) {
  let model!: ReturnType<typeof useAccountDeletion>;
  function Probe() {
    harness.stateIdx = 0;
    harness.refIdx = 0;
    model = useAccountDeletion({
      csrfToken: 'csrf-del',
      hasLinkedProfile,
      submitDeletion,
      onDeleted,
    });
    return null;
  }
  const rerender = () => {
    renderToStaticMarkup(<Probe />);
    return model;
  };
  return { rerender, model: rerender(), onDeleted };
}

it('TC-831: không có hồ sơ liên kết chỉ gửi { password } và điều hướng sau 204', async () => {
  const submitDeletion = vi.fn<SubmitAccountDeletion>().mockResolvedValue({ ok: true, data: undefined });
  const mounted = mount(false, submitDeletion);
  mounted.model.openDialog();
  expect(mounted.rerender().canSubmit).toBe(false);

  mounted.rerender().setPassword('matkhau123');
  mounted.rerender().setDisposition('delete');
  const ready = mounted.rerender();
  expect(ready.canSubmit).toBe(true);

  await ready.submit();
  expect(submitDeletion).toHaveBeenCalledExactlyOnceWith({ password: 'matkhau123' }, 'csrf-del');
  expect(mounted.onDeleted).toHaveBeenCalledTimes(1);
});

it('TC-827/TC-828: có hồ sơ liên kết bắt buộc chọn phương án và gửi kèm ownProfileDisposition', async () => {
  const submitDeletion = vi.fn<SubmitAccountDeletion>().mockResolvedValue({ ok: true, data: undefined });
  const mounted = mount(true, submitDeletion);
  mounted.model.openDialog();
  mounted.rerender().setPassword('matkhau123');
  expect(mounted.rerender().disposition).toBeNull();
  expect(mounted.rerender().canSubmit).toBe(false);

  mounted.rerender().setDisposition('delete');
  const ready = mounted.rerender();
  expect(ready.canSubmit).toBe(true);

  await ready.submit();
  expect(submitDeletion).toHaveBeenCalledExactlyOnceWith(
    { password: 'matkhau123', ownProfileDisposition: 'delete' },
    'csrf-del',
  );
  expect(mounted.onDeleted).toHaveBeenCalledTimes(1);
});

it.each([
  ['TC-830', 'ERR_INVALID_CREDENTIALS', 'Tên đăng nhập hoặc mật khẩu chưa đúng.'],
  ['TC-829', 'ERR_OWNER_MUST_TRANSFER', 'Hãy trao quyền Chủ hộ cho người khác trước.'],
  [
    'SPEC-073',
    'ERR_OWNER_MUST_DELETE_FAMILY',
    'Bạn là người duy nhất trong nhà. Hãy xoá nhà nếu không dùng nữa.',
  ],
  [
    'SPEC-073',
    'ERR_LAST_GUARDIAN',
    'Bạn là người giám hộ duy nhất của một hồ sơ trẻ. Hãy thêm người giám hộ khác trước.',
  ],
  ['SPEC-073', 'ERR_RATE_LIMITED', 'Bạn thao tác quá nhanh, vui lòng thử lại sau.'],
  ['SPEC-073', 'ERR_VALIDATION', 'Dữ liệu gửi lên không đúng định dạng quy định.'],
  [
    'SPEC-073',
    'ERR_AUTH_UNAVAILABLE',
    'Hệ thống xác thực đang bận hoặc tạm gián đoạn. Vui lòng thử lại sau.',
  ],
  ['SPEC-073', 'NETWORK', 'Mất kết nối. Kiểm tra mạng rồi thử lại.'],
  ['SPEC-073', 'UNKNOWN', 'Không thể kết nối. Vui lòng thử lại.'],
])('%s: lỗi %s giữ nguyên hộp thoại, giữ lại mật khẩu và hiển thị đúng lỗi', async (_tc, code, message) => {
  const submitDeletion = vi.fn<SubmitAccountDeletion>().mockResolvedValue({ ok: false, code });
  const mounted = mount(false, submitDeletion);
  mounted.model.openDialog();
  mounted.rerender().setPassword('matkhau-sai');
  await mounted.rerender().submit();

  const after = mounted.rerender();
  expect(after.open).toBe(true);
  expect(after.pending).toBe(false);
  expect(after.password).toBe('matkhau-sai');
  expect(after.error).toBe(message);
  expect(after.errorCode).toBe(code);
  expect(mounted.onDeleted).not.toHaveBeenCalled();
});

it('không cho đóng hộp thoại khi đang gửi yêu cầu xoá', async () => {
  let release!: () => void;
  const submitDeletion = vi.fn<SubmitAccountDeletion>(
    () =>
      new Promise((resolve) => {
        release = () => resolve({ ok: false, code: 'ERR_INVALID_CREDENTIALS' });
      }),
  );
  const mounted = mount(false, submitDeletion);
  mounted.model.openDialog();
  mounted.rerender().setPassword('matkhau123');
  const pendingPromise = mounted.rerender().submit();

  const whilePending = mounted.rerender();
  expect(whilePending.pending).toBe(true);
  whilePending.closeDialog();
  expect(mounted.rerender().open).toBe(true);

  release();
  await pendingPromise;
  mounted.rerender().closeDialog();
  expect(mounted.rerender().open).toBe(false);
});

it('TC-827: bấm đúp chỉ gửi một POST xoá tài khoản', async () => {
  const submitDeletion = vi
    .fn<SubmitAccountDeletion>()
    .mockResolvedValue({ ok: false, code: 'ERR_INVALID_CREDENTIALS' });
  const mounted = mount(false, submitDeletion);
  mounted.model.openDialog();
  mounted.rerender().setPassword('matkhau123');
  const ready = mounted.rerender();
  await Promise.all([ready.submit(), ready.submit()]);
  expect(submitDeletion).toHaveBeenCalledExactlyOnceWith({ password: 'matkhau123' }, 'csrf-del');
});
