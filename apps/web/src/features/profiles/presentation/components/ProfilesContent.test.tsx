import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ProfilesContent } from './ProfilesContent';
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, className }: { to: string; children: ReactNode; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));
const props = {
  profiles: [],
  loading: false,
  error: false,
  retry: () => undefined,
  onConsent: () => undefined,
};
describe('Trang Nhà: rỗng, tải và lỗi', () => {
  it('rỗng có lời mời và liên kết tạo hồ sơ, không có dữ liệu y tế giả', () => {
    const html = renderToStaticMarkup(<ProfilesContent {...props} />);
    expect(html).toContain('Tạo hồ sơ đầu tiên cho người bạn chăm');
    expect(html).toContain('href="/profiles/new"');
    expect(html).not.toContain('mmHg');
  });
  it('đang tải giữ ba khung thẻ và không báo rỗng', () => {
    const html = renderToStaticMarkup(<ProfilesContent {...props} loading />);
    expect(html).toContain('Đang tải hồ sơ');
    expect(html.match(/animate-pulse/g)).toHaveLength(3);
    expect(html).not.toContain('Tạo hồ sơ đầu tiên');
  });
  it('lỗi hiển thị thông báo và nút thử lại', () => {
    const html = renderToStaticMarkup(<ProfilesContent {...props} error />);
    expect(html).toContain('role="alert"');
    expect(html).toContain('Thử lại');
  });
});
