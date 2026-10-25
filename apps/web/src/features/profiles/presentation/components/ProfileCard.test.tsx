import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ProfileCard } from './ProfileCard';
import type { HealthProfile } from '../../application/ports';
const profile: HealthProfile = {
  id: 'p',
  familyId: 'f',
  displayName: 'Mẹ',
  birthYear: 1954,
  consentConfirmedAt: null,
  consentConfirmedBy: null,
  consentBasis: null,
  createdAt: '2026-10-06T00:00:00Z',
  consentStatus: 'pending',
  consentSource: null,
  consentRespondentName: null,
};
describe('Đồng thuận bằng lời mời, không suy diễn từ metadata cũ', () => {
  it('metadata xác nhận legacy không mở gate; yêu cầu lời mời mới', () => {
    const html = renderToStaticMarkup(
      <ProfileCard
        profile={{
          ...profile,
          consentConfirmedAt: '2026-10-06T00:00:00Z',
          consentSource: 'legacy_attestation',
        }}
        onConsent={() => undefined}
        onDelete={() => undefined}
      />,
    );
    expect(html).toContain('Tạo link mời người thân');
    expect(html).not.toContain('Đã đồng ý chia sẻ');
    expect(html).toContain('Xác nhận cũ');
    expect(html).toContain('Năm sinh 1954');
    expect(html).not.toContain('tuổi');
  });
  it.each(['invited', 'declined'] as const)('thể hiện trạng thái %s', (status) => {
    const html = renderToStaticMarkup(
      <ProfileCard
        profile={{ ...profile, consentStatus: status }}
        onConsent={() => undefined}
        onDelete={() => undefined}
      />,
    );
    expect(html).toContain(status === 'invited' ? 'Quản lý link xác nhận' : 'Tạo link mời người thân');
  });
  it('đã đồng thuận ghi tên tự khai và giới hạn xác minh; không có main xác nhận thay', () => {
    const html = renderToStaticMarkup(
      <ProfileCard
        profile={{
          ...profile,
          consentStatus: 'confirmed',
          consentSource: 'invitation',
          consentRespondentName: 'An',
        }}
        onConsent={() => undefined}
        onDelete={() => undefined}
      />,
    );
    expect(html).toContain('Đã đồng ý chia sẻ');
    expect(html).toContain('An');
    expect(html).toContain('chưa được xác minh');
    // Chỉ còn nút xóa hồ sơ; không có nút tạo/quản lý link hay xác nhận thay.
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).not.toContain('link');
  });
  it('TC-387: hồ sơ withdrawn có nhãn rút đồng thuận và nút tạo link mời', () => {
    const html = renderToStaticMarkup(
      <ProfileCard
        profile={{ ...profile, consentStatus: 'withdrawn' }}
        onConsent={() => undefined}
        onDelete={() => undefined}
      />,
    );
    expect(html).toContain('Người thân đã rút đồng thuận');
    expect(html).toContain('Tạo link mời người thân');
  });
  it('SPEC-007: thẻ hồ sơ có nút chữ "Xóa hồ sơ" ở cuối', () => {
    const html = renderToStaticMarkup(
      <ProfileCard profile={profile} onConsent={() => undefined} onDelete={() => undefined} />,
    );
    expect(html).toMatch(/Xóa hồ sơ<\/button><\/article>$/);
  });
});
