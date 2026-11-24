import { useEffect } from 'react';
import type * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { VerifyEmailError } from './VerifyEmailError';
import { VerifyEmailInvalid } from './VerifyEmailInvalid';
import { VerifyEmailPage } from './VerifyEmailPage';
import { VerifyEmailPending } from './VerifyEmailPending';
import { VerifyEmailSuccess } from './VerifyEmailSuccess';
import { VerifyEmailTaken } from './VerifyEmailTaken';

const effects: React.EffectCallback[] = [];
vi.mock('react', async (original) => ({
  ...(await original<typeof React>()),
  useEffect: vi.fn((effect: React.EffectCallback) => {
    effects.push(effect);
  }),
}));

vi.mock('@src/features/account/infrastructure/submitEmailVerificationConfirm', () => ({
  submitEmailVerificationConfirm: vi.fn(() => new Promise(() => {})),
}));

afterEach(() => {
  effects.length = 0;
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

it('TC-925: có token hiển thị trạng thái đang xử lý trong LoginLayout và xoá hash', () => {
  const replaceState = vi.fn();
  vi.stubGlobal('location', { pathname: '/verify-email', search: '', hash: '#token=abc123' });
  vi.stubGlobal('history', { replaceState });
  const html = renderToStaticMarkup(<VerifyEmailPage />);
  effects.forEach((effect) => effect());
  expect(replaceState).toHaveBeenCalledExactlyOnceWith(null, '', '/verify-email');
  expect(html).toContain('login-brand-panel');
  expect(html).toContain('login-form-panel');
  expect(html).toContain('id="verify-title"');
  expect(html).toContain('tabindex="-1"');
  expect(html).toContain('Đang xác minh email của bạn…');
  expect(html).toContain('role="status"');
  expect(html).toContain('aria-live="polite"');
  expect(html).not.toContain('Trạng thái');
  expect(html).not.toContain('→');
});

it('TC-926: thiếu token hiển thị ngay trạng thái liên kết không dùng được', () => {
  vi.stubGlobal('location', { pathname: '/verify-email', search: '', hash: '' });
  const html = renderToStaticMarkup(<VerifyEmailPage />);
  expect(html).toContain('Liên kết không dùng được');
  expect(html).toContain('Liên kết xác minh không hợp lệ hoặc đã hết hạn.');
  expect(html).toContain('Hãy mở Tài khoản và bấm “Xác minh email” để nhận liên kết mới.');
  expect(html).toContain('Mở Tài khoản');
  expect(html).toContain('href="/account"');
  expect(html).not.toContain('Đang xác minh email của bạn…');
});

it('TC-925: trạng thái đang xử lý đặt focus vào tiêu đề và có aria-live', () => {
  const html = renderToStaticMarkup(<VerifyEmailPending />);
  expect(html).toContain('id="verify-title"');
  expect(html).toContain('tabindex="-1"');
  expect(html).toContain('Đang xác minh email của bạn…');
  expect(html).toContain('role="status"');
  expect(html).toContain('aria-live="polite"');
  expect(useEffect).toHaveBeenCalled();
});

it('TC-925: trạng thái thành công hiển thị đúng nội dung, icon Stitch, aria-live và nút Vào AN GIA', () => {
  const html = renderToStaticMarkup(<VerifyEmailSuccess />);
  expect(html).toContain('id="verify-title"');
  expect(html).toContain('tabindex="-1"');
  expect(html).toContain('Đã xác minh email');
  expect(html).toContain(
    'Email của bạn đã được xác minh. Bạn có thể dùng email này để đăng nhập và đặt lại mật khẩu.',
  );
  expect(html).toContain('role="status"');
  expect(html).toContain('aria-live="polite"');
  expect(html).toContain('Vào AN GIA');
  expect(html).toContain('href="/"');
  expect(html).toContain('verify-check.svg');
  expect(html).toContain('verify-arrow-right.svg');
  expect(html).not.toContain('→');
  expect(useEffect).toHaveBeenCalled();
});

it('TC-926: trạng thái link hỏng hiển thị đúng nội dung, icon khoá-đồng hồ Stitch và nút Mở Tài khoản', () => {
  const html = renderToStaticMarkup(<VerifyEmailInvalid />);
  expect(html).toContain('id="verify-title"');
  expect(html).toContain('tabindex="-1"');
  expect(html).toContain('Liên kết không dùng được');
  expect(html).toContain('Liên kết xác minh không hợp lệ hoặc đã hết hạn.');
  expect(html).toContain('Hãy mở Tài khoản và bấm “Xác minh email” để nhận liên kết mới.');
  expect(html).toContain('role="status"');
  expect(html).toContain('aria-live="polite"');
  expect(html).toContain('Mở Tài khoản');
  expect(html).toContain('href="/account"');
  expect(html).toContain('verify-lock.svg');
  expect(html).toContain('verify-clock.svg');
  expect(html).toContain('verify-arrow-right.svg');
  expect(html).not.toContain('→');
  expect(useEffect).toHaveBeenCalled();
});

it('TC-931: trạng thái email trùng hiển thị đúng nội dung, icon cảnh báo Stitch và nút Mở Tài khoản', () => {
  const html = renderToStaticMarkup(<VerifyEmailTaken />);
  expect(html).toContain('id="verify-title"');
  expect(html).toContain('tabindex="-1"');
  expect(html).toContain('Không xác minh được');
  expect(html).toContain('Email này đã được một tài khoản khác xác minh.');
  expect(html).toContain('Hãy dùng một email khác trong Tài khoản.');
  expect(html).toContain('role="status"');
  expect(html).toContain('aria-live="polite"');
  expect(html).toContain('Mở Tài khoản');
  expect(html).toContain('href="/account"');
  expect(html).toContain('verify-warning.svg');
  expect(html).toContain('verify-arrow-right.svg');
  expect(html).not.toContain('→');
  expect(useEffect).toHaveBeenCalled();
});

it('trạng thái lỗi tạm thời hiển thị alert lỗi chung, nút Thử lại và liên kết Mở Tài khoản', () => {
  const message = 'Bạn thao tác quá nhanh, vui lòng thử lại sau.';
  const html = renderToStaticMarkup(<VerifyEmailError message={message} onRetry={vi.fn()} />);
  expect(html).toContain('id="verify-title"');
  expect(html).toContain('tabindex="-1"');
  expect(html).toContain('Không xác minh được');
  expect(html).toContain('role="alert"');
  expect(html).toContain(message);
  expect(html).toContain('Thử lại');
  expect(html).toContain('Mở Tài khoản');
  expect(html).toContain('href="/account"');
  expect(html).toContain('verify-warning.svg');
  expect(html).not.toContain('→');
  expect(useEffect).toHaveBeenCalled();
});
