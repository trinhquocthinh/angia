import { useEffect } from 'react';
import type * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import type { SubmitPasswordReset } from './ports';
import { useResetPasswordForm } from './useResetPasswordForm';

const mocks = vi.hoisted(() => ({
  effects: [] as React.EffectCallback[],
  stageOverride: null as 'done' | 'invalid' | null,
  stages: [] as string[],
  errors: [] as (string | null)[],
}));

vi.mock('react', async (original) => ({
  ...(await original<typeof React>()),
  useEffect: vi.fn((effect: React.EffectCallback) => {
    mocks.effects.push(effect);
  }),
  useState: <T,>(initial: T | (() => T)) => {
    let value = typeof initial === 'function' ? (initial as () => T)() : initial;
    if (value === 'form' && mocks.stageOverride) value = mocks.stageOverride as T;
    return [
      value,
      (next: T | ((prev: T) => T)) => {
        value = typeof next === 'function' ? (next as (prev: T) => T)(value) : next;
        const current: unknown = value;
        if (current === 'form' || current === 'invalid' || current === 'done') mocks.stages.push(current);
        else if (typeof current === 'string' || current === null) mocks.errors.push(current);
      },
    ] as const;
  },
}));

afterEach(() => {
  mocks.stageOverride = null;
  mocks.effects.length = 0;
  mocks.stages.length = 0;
  mocks.errors.length = 0;
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

function mount(hash: string, submitReset: SubmitPasswordReset) {
  const replaceState = vi.fn();
  vi.stubGlobal('requestAnimationFrame', (callback: () => void) => {
    callback();
    return 0;
  });
  vi.stubGlobal('location', { pathname: '/reset-password', search: '', hash });
  vi.stubGlobal('history', { replaceState });
  let model!: ReturnType<typeof useResetPasswordForm>;
  function Probe() {
    model = useResetPasswordForm(submitReset);
    return (
      <>
        <input {...model.form.register('password')} />
        <input {...model.form.register('confirmation')} />
      </>
    );
  }
  renderToStaticMarkup(<Probe />);
  mocks.effects.forEach((effect) => effect());
  return { model, replaceState };
}

it('TC-765: thiếu token trong hash chuyển ngay sang trạng thái link hỏng và không gọi API', () => {
  const submit = vi.fn<SubmitPasswordReset>();
  const { model } = mount('', submit);
  expect(model.stage).toBe('invalid');
  expect(submit).not.toHaveBeenCalled();
});

it('TC-764: đọc token từ hash, xoá hash khỏi URL và gửi đúng body nhận 204', async () => {
  const submit = vi.fn<SubmitPasswordReset>().mockResolvedValue({ ok: true, data: undefined });
  const { model, replaceState } = mount('#token=valid-token', submit);
  expect(model.stage).toBe('form');
  expect(replaceState).toHaveBeenCalledExactlyOnceWith(null, '', '/reset-password');
  model.form.setValue('password', 'MatKhauMoi123');
  model.form.setValue('confirmation', 'MatKhauMoi123');
  await model.submit();
  expect(submit).toHaveBeenCalledExactlyOnceWith({
    token: 'valid-token',
    newPassword: 'MatKhauMoi123',
  });
  expect(mocks.stages.at(-1)).toBe('done');
});

it('kiểm độ dài và khớp mật khẩu trước khi gọi API giống màn hiện có', async () => {
  const submit = vi.fn<SubmitPasswordReset>();
  const { model } = mount('#token=valid-token', submit);
  model.form.setValue('password', 'ngan');
  model.form.setValue('confirmation', 'ngan');
  await model.submit();
  expect(model.form.getFieldState('password').error?.message).toBe('Mật khẩu cần ít nhất 8 ký tự.');
  model.form.setValue('password', 'MatKhauMoi123');
  model.form.setValue('confirmation', 'KhacMatKhau123');
  await model.submit();
  expect(model.form.getFieldState('confirmation').error?.message).toBe('Hai mật khẩu chưa khớp.');
  expect(submit).not.toHaveBeenCalled();
});

it('TC-765: 400 ERR_RESET_TOKEN_INVALID chuyển sang trạng thái link hỏng', async () => {
  const { model } = mount('#token=expired', async () => ({
    ok: false,
    code: 'ERR_RESET_TOKEN_INVALID',
    status: 400,
  }));
  model.form.setValue('password', 'MatKhauMoi123');
  model.form.setValue('confirmation', 'MatKhauMoi123');
  await model.submit();
  expect(mocks.stages.at(-1)).toBe('invalid');
});

it.each([
  [422, 'ERR_VALIDATION', 'Dữ liệu gửi lên không đúng định dạng quy định.'],
  [429, 'ERR_RATE_LIMITED', 'Bạn thao tác quá nhanh, vui lòng thử lại sau.'],
  [503, 'ERR_AUTH_UNAVAILABLE', 'Hệ thống xác thực đang bận hoặc tạm gián đoạn. Vui lòng thử lại sau.'],
])('HTTP %s (%s) hiện lỗi dưới nút và không đổi trạng thái', async (status, code, message) => {
  const { model } = mount('#token=valid-token', async () => ({
    ok: false,
    code,
    field: 'newPassword',
    status,
  }));
  model.form.setValue('password', 'MatKhauMoi123');
  model.form.setValue('confirmation', 'MatKhauMoi123');
  await model.submit();
  expect(model.form.getFieldState('password').error).toBeUndefined();
  expect(mocks.errors.at(-1)).toBe(message);
  expect(mocks.stages).toEqual([]);
  expect(useEffect).toHaveBeenCalled();
});

it.each(['done', 'invalid'] as const)('TC-764: xoá dữ liệu form khi chuyển trạng thái %s', (stage) => {
  mocks.stageOverride = stage;
  const { model } = mount('#token=fixture', vi.fn<SubmitPasswordReset>());
  model.form.setValue('password', 'MatKhauMoi123');
  // Chạy effect của lần render trạng thái kết thúc sau khi RHF đã gắn form.
  mocks.effects.forEach((effect) => effect());
  expect(model.form.control._formValues).toEqual({ password: '', confirmation: '' });
});
