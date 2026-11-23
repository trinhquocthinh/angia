import type * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import type { AccountResult, SubmitEmailVerificationConfirm } from './ports';
import { useVerifyEmail } from './useVerifyEmail';

const mocks = vi.hoisted(() => ({
  effects: [] as React.EffectCallback[],
  states: [] as { stage: string; error: string | null }[],
  refs: new Map<number, { current: unknown }>(),
  refIndex: 0,
  attempt: 0,
}));

vi.mock('react', async (original) => ({
  ...(await original<typeof React>()),
  useEffect: vi.fn((effect: React.EffectCallback) => {
    mocks.effects.push(effect);
  }),
  useRef: <T,>(initial: T) => {
    const slot = mocks.refIndex++;
    if (!mocks.refs.has(slot)) mocks.refs.set(slot, { current: initial });
    return mocks.refs.get(slot) as { current: T };
  },
  useState: <T,>(initial: T | (() => T)) => {
    let value = typeof initial === 'function' ? (initial as () => T)() : initial;
    if (typeof value === 'number') value = mocks.attempt as T;
    return [
      value,
      (next: T | ((prev: T) => T)) => {
        value = typeof next === 'function' ? (next as (prev: T) => T)(value) : next;
        if (typeof value === 'number') mocks.attempt = value;
        else if (value && typeof value === 'object' && 'stage' in value)
          mocks.states.push(value as unknown as { stage: string; error: string | null });
      },
    ] as const;
  },
}));

afterEach(() => {
  mocks.effects.length = 0;
  mocks.states.length = 0;
  mocks.refs.clear();
  mocks.refIndex = 0;
  mocks.attempt = 0;
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

function mount(hash: string, confirm: SubmitEmailVerificationConfirm) {
  const replaceState = vi.fn();
  vi.stubGlobal('location', { pathname: '/verify-email', search: '', hash });
  vi.stubGlobal('history', { replaceState });
  let model!: ReturnType<typeof useVerifyEmail>;
  function Probe() {
    mocks.refIndex = 0;
    model = useVerifyEmail(confirm);
    return null;
  }
  renderToStaticMarkup(<Probe />);
  return {
    get model() {
      return model;
    },
    replaceState,
    rerender: () => {
      mocks.effects.length = 0;
      renderToStaticMarkup(<Probe />);
    },
  };
}

const flush = () => Promise.resolve().then(() => Promise.resolve());

it('TC-926: thiếu token trong hash chuyển ngay sang trạng thái link hỏng và không gọi API', () => {
  const confirm = vi.fn<SubmitEmailVerificationConfirm>();
  const { model } = mount('', confirm);
  mocks.effects.forEach((effect) => effect());
  expect(model.stage).toBe('invalid');
  expect(confirm).not.toHaveBeenCalled();
});

it('TC-925: đọc token từ hash, xoá hash khỏi URL và nhận 204 thành công', async () => {
  const confirm = vi.fn<SubmitEmailVerificationConfirm>().mockResolvedValue({ ok: true, data: undefined });
  const { model, replaceState } = mount('#token=valid-token', confirm);
  expect(model.stage).toBe('verifying');
  mocks.effects.forEach((effect) => effect());
  await flush();
  expect(replaceState).toHaveBeenCalledExactlyOnceWith(null, '', '/verify-email');
  expect(confirm).toHaveBeenCalledExactlyOnceWith({ token: 'valid-token' });
  expect(mocks.states.at(-1)).toEqual({ stage: 'success', error: null });
});

it('TC-925: StrictMode chạy effect hai lần vẫn chỉ gọi API xác nhận đúng MỘT lần và vẫn cập nhật kết quả', async () => {
  let resolveConfirm!: (value: AccountResult<void>) => void;
  const confirm = vi.fn<SubmitEmailVerificationConfirm>(
    () =>
      new Promise<AccountResult<void>>((resolve) => {
        resolveConfirm = resolve;
      }),
  );
  mount('#token=once-token', confirm);
  const cleanup = mocks.effects[0]?.();
  cleanup?.();
  mocks.effects[0]?.();
  expect(confirm).toHaveBeenCalledExactlyOnceWith({ token: 'once-token' });
  resolveConfirm({ ok: true, data: undefined });
  await flush();
  expect(mocks.states).toEqual([{ stage: 'success', error: null }]);
});

it('TC-925: huỷ cập nhật trạng thái nếu component unmount trước khi API phản hồi', async () => {
  let resolveConfirm!: (value: AccountResult<void>) => void;
  const confirm = vi.fn<SubmitEmailVerificationConfirm>(
    () =>
      new Promise<AccountResult<void>>((resolve) => {
        resolveConfirm = resolve;
      }),
  );
  mount('#token=unmount-token', confirm);
  const cleanup = mocks.effects[0]?.();
  cleanup?.();
  resolveConfirm({ ok: true, data: undefined });
  await flush();
  expect(mocks.states).toEqual([]);
});

it('TC-926: 400 ERR_VERIFICATION_TOKEN_INVALID chuyển sang trạng thái link hỏng', async () => {
  const confirm = vi.fn<SubmitEmailVerificationConfirm>().mockResolvedValue({
    ok: false,
    code: 'ERR_VERIFICATION_TOKEN_INVALID',
    status: 400,
  });
  mount('#token=expired-token', confirm);
  mocks.effects.forEach((effect) => effect());
  await flush();
  expect(mocks.states.at(-1)).toEqual({ stage: 'invalid', error: null });
});

it('TC-931: 409 ERR_EMAIL_TAKEN chuyển sang trạng thái email trùng', async () => {
  const confirm = vi.fn<SubmitEmailVerificationConfirm>().mockResolvedValue({
    ok: false,
    code: 'ERR_EMAIL_TAKEN',
    status: 409,
  });
  mount('#token=taken-token', confirm);
  mocks.effects.forEach((effect) => effect());
  await flush();
  expect(mocks.states.at(-1)).toEqual({ stage: 'taken', error: null });
});

it.each([
  [429, 'ERR_RATE_LIMITED', 'Bạn thao tác quá nhanh, vui lòng thử lại sau.'],
  [503, 'ERR_AUTH_UNAVAILABLE', 'Hệ thống xác thực đang bận hoặc tạm gián đoạn. Vui lòng thử lại sau.'],
  [undefined, 'NETWORK', 'Mất kết nối. Kiểm tra mạng rồi thử lại.'],
])('lỗi tạm thời %s (%s) hiển thị lỗi chung và cho phép thử lại', async (status, code, message) => {
  const confirm = vi
    .fn<SubmitEmailVerificationConfirm>()
    .mockResolvedValueOnce({ ok: false, code, ...(status !== undefined ? { status } : {}) })
    .mockResolvedValueOnce({ ok: true, data: undefined });
  const handle = mount('#token=retry-token', confirm);
  mocks.effects.forEach((effect) => effect());
  await flush();
  expect(mocks.states.at(-1)).toEqual({ stage: 'error', error: message });

  handle.model.retry();
  expect(mocks.states.at(-1)).toEqual({ stage: 'verifying', error: null });
  handle.rerender();
  mocks.effects.forEach((effect) => effect());
  await flush();
  expect(confirm).toHaveBeenCalledTimes(2);
  expect(mocks.states.at(-1)).toEqual({ stage: 'success', error: null });
});
