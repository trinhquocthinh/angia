import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { SelfTabs } from './SelfTabs';

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    'aria-current': ariaCurrent,
  }: {
    children: ReactNode;
    'aria-current'?: 'page' | undefined;
  }) => <a aria-current={ariaCurrent}>{children}</a>,
}));

describe('SPEC-081 — mục lục Hồ sơ của tôi dùng bộ icon 3D đất sét đồng bộ', () => {
  it('hiển thị đầy đủ mục cùng icon 3D và đánh dấu mục đang chọn', () => {
    const html = renderToStaticMarkup(<SelfTabs active="pain" showsVitals />);
    expect(html).toContain('/images/profile-sections/medications-3d.png');
    expect(html).toContain('/images/profile-sections/health-3d.png');
    expect(html).toContain('/images/profile-sections/temperatures-3d.png');
    expect(html).toContain('/images/profile-sections/pain-3d.png');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('profile-bento-tile-dot');
  });

  it('BR-049 — ẩn mục Diễn biến sức khỏe khi showsVitals=false', () => {
    const html = renderToStaticMarkup(<SelfTabs active="today" showsVitals={false} />);
    expect(html).not.toContain('/images/profile-sections/health-3d.png');
    expect(html).not.toContain('Diễn biến sức khỏe');
  });
});
