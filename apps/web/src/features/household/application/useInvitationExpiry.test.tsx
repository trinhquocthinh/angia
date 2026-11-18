import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { useInvitationExpiry } from './useInvitationExpiry';

afterEach(() => vi.useRealTimers());
it('TC-777: không có mã thì chưa hết hạn, mã quá hạn bị khoá ngay khi mở', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-25T07:30:00Z'));
  function Probe({ expiresAt }: { expiresAt?: string }) {
    return <span>{String(useInvitationExpiry(expiresAt))}</span>;
  }
  expect(renderToStaticMarkup(<Probe />)).toBe('<span>false</span>');
  expect(renderToStaticMarkup(<Probe expiresAt="2026-11-25T07:30:00Z" />)).toBe('<span>true</span>');
  expect(renderToStaticMarkup(<Probe expiresAt="2026-11-25T07:30:01Z" />)).toBe('<span>false</span>');
});
