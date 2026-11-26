import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ProfileIdentityHero } from './ProfileIdentityHero';

describe('SPEC-081 — thẻ định danh hồ sơ dùng chung 3D Bento v2.0', () => {
  it('hiển thị chữ cái avatar, tuổi, năm sinh và nhãn đã đồng thuận', () => {
    const html = renderToStaticMarkup(
      <ProfileIdentityHero
        title="Hồ sơ của tôi"
        displayName="Mẹ Hoa"
        subtitle="Mẹ Hoa"
        birthYear={1954}
        consentStatus="confirmed"
      />,
    );
    expect(html).toContain('Hồ sơ của tôi');
    expect(html).toContain('Mẹ Hoa');
    expect(html).toContain('1954');
    expect(html).toContain('Đã đồng thuận');
    expect(html).toContain('profile-ceramic-badge');
  });

  it('trạng thái chờ/rút đồng thuận đổi nhãn phù hợp và ẩn dấu xác minh trên avatar', () => {
    const pending = renderToStaticMarkup(
      <ProfileIdentityHero
        title="Bà ngoại"
        displayName="Bà ngoại"
        birthYear={null}
        consentStatus="pending"
      />,
    );
    expect(pending).toContain('Chờ đồng thuận');
    expect(pending).toContain('Chưa có năm sinh');
    expect(pending).not.toContain('profile-ceramic-badge');

    const withdrawn = renderToStaticMarkup(
      <ProfileIdentityHero title="Ba" displayName="Ba" birthYear={1950} consentStatus="withdrawn" />,
    );
    expect(withdrawn).toContain('Đã rút đồng thuận');
  });
});
