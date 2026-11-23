import { useEffect } from 'react';
import type * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { ResetPasswordForm } from './ResetPasswordForm';
import { ResetPasswordInvalid } from './ResetPasswordInvalid';
import { ResetPasswordPage } from './ResetPasswordPage';
import { ResetPasswordSuccess } from './ResetPasswordSuccess';

const effects: React.EffectCallback[] = [];
vi.mock('react', async (original) => ({
  ...(await original<typeof React>()),
  useEffect: vi.fn((effect: React.EffectCallback) => {
    effects.push(effect);
  }),
}));

afterEach(() => {
  effects.length = 0;
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

it('TC-764: có token trong hash hiển thị form đặt mật khẩu mới, độ mạnh, icon Stitch và xoá hash', () => {
  const replaceState = vi.fn();
  vi.stubGlobal('location', { pathname: '/reset-password', search: '', hash: '#token=abc123' });
  vi.stubGlobal('history', { replaceState });
  const html = renderToStaticMarkup(<ResetPasswordPage />);
  effects.forEach((effect) => effect());
  expect(replaceState).toHaveBeenCalledExactlyOnceWith(null, '', '/reset-password');
  expect(html).toContain('login-brand-panel');
  expect(html).toContain('login-form-panel');
  expect(html).toContain('Đặt mật khẩu mới');
  expect(html).toContain('Nhập mật khẩu mới cho tài khoản của bạn.');
  expect(html).toContain('Mật khẩu mới');
  expect(html).toContain('Nhập lại mật khẩu mới');
  expect(html).toContain('role="meter"');
  expect(html).toContain('Đặt mật khẩu');
  expect(html).toContain('Quay lại đăng nhập');
  expect(html).toContain('href="/login"');
  expect(html).toContain('reset-key.svg');
  expect(html).toContain('reset-arrow_forward.svg');
  expect(html).toContain('forgot-arrow_back.svg');
  expect(html).not.toContain('me.lan');
  expect(html).not.toContain('5 phút');
  expect(html).not.toContain('256-bit');
  expect(html).not.toContain('1800');
});

it('TC-765: thiếu token hiển thị ngay trạng thái liên kết không dùng được, không render form', () => {
  vi.stubGlobal('location', { pathname: '/reset-password', search: '', hash: '' });
  const html = renderToStaticMarkup(<ResetPasswordPage />);
  expect(html).toContain('Liên kết không dùng được');
  expect(html).toContain('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
  expect(html).toContain('Yêu cầu liên kết mới');
  expect(html).toContain('href="/forgot-password"');
  expect(html).not.toContain('<form');
});

it('TC-765: màn link hỏng có aria-live, tiêu đề nhận focus và đúng icon Stitch', () => {
  const html = renderToStaticMarkup(<ResetPasswordInvalid />);
  expect(html).toContain('id="reset-title"');
  expect(html).toContain('tabindex="-1"');
  expect(html).toContain('Liên kết không dùng được');
  expect(html).toContain('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
  expect(html).toContain('aria-live="polite"');
  expect(html).toContain('role="status"');
  expect(html).toContain('href="/forgot-password"');
  expect(html).toContain('reset-lock_clock.svg');
  expect(html).toContain('reset-refresh.svg');
});

it('TC-764: màn thành công có thông điệp chính xác, aria-live, tiêu đề nhận focus và nút Đăng nhập', () => {
  const html = renderToStaticMarkup(<ResetPasswordSuccess />);
  expect(html).toContain('id="reset-title"');
  expect(html).toContain('tabindex="-1"');
  expect(html).toContain('Đã đặt lại mật khẩu');
  expect(html).toContain('Mật khẩu đã được đặt lại. Hãy đăng nhập bằng mật khẩu mới.');
  expect(html).toContain('aria-live="polite"');
  expect(html).toContain('role="status"');
  expect(html).toContain('href="/login"');
  expect(html).toContain('Đăng nhập');
  expect(html).toContain('reset-verified.svg');
  expect(useEffect).toHaveBeenCalled();
});

it('lỗi 422 ở form đặt lại mật khẩu hiển thị dưới nút Đặt mật khẩu', () => {
  const message = 'Dữ liệu gửi lên không đúng định dạng quy định.';
  const form = {
    register: (name: string) => ({ name }),
    watch: () => '',
    formState: { isSubmitting: false, errors: {} },
  } as never;
  const html = renderToStaticMarkup(
    <ResetPasswordForm model={{ form, submit: vi.fn(), error: message, stage: 'form' }} />,
  );
  expect(html).toContain('role="alert"');
  expect(html).toContain(message);
  expect(html.indexOf('role="alert"')).toBeGreaterThan(html.indexOf('type="submit"'));
});

it('TC-764: mở form đặt focus vào mật khẩu mới', () => {
  const setFocus = vi.fn();
  const form = {
    register: (name: string) => ({ name }),
    watch: () => '',
    setFocus,
    formState: { isSubmitting: false, errors: {} },
  } as never;
  renderToStaticMarkup(<ResetPasswordForm model={{ form, submit: vi.fn(), error: null, stage: 'form' }} />);
  effects.forEach((effect) => effect());
  expect(setFocus).toHaveBeenCalledExactlyOnceWith('password');
});
