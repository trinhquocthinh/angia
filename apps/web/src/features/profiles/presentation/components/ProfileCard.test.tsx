import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ProfileCard } from './ProfileCard';
import type { ProfileListItem } from '../../application/ports';
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, params, children }: { to: string; params: { profileId: string }; children: ReactNode }) => (
    <a href={to.replace('$profileId', params.profileId)}>{children}</a>
  ),
}));
const profile: ProfileListItem = {
  consentAction: 'attestation',
  consentConfirmedByName: null,
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
describe('TC-558 — thẻ hồ sơ chọn đúng thao tác đồng thuận', () => {
  it('metadata xác nhận legacy không mở gate; yêu cầu cam kết mới', () => {
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
    expect(html).toContain('Xác nhận đồng ý');
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
    expect(html).toContain('Xác nhận đồng ý');
    expect(html).not.toContain('Tạo link mời người thân');
  });
  it('đã đồng thuận ghi tên tự khai và giới hạn xác minh; không có main xác nhận thay', () => {
    const html = renderToStaticMarkup(
      <ProfileCard
        profile={{
          ...profile,
          consentStatus: 'confirmed',
          consentAction: null,
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
        profile={{ ...profile, consentStatus: 'withdrawn', consentAction: 'invitation' }}
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
    expect(html).toMatch(/Xóa hồ sơ<\/button>(<\/div>)+<\/article>$/);
  });
  it('TC-393 — tên hồ sơ và nút "Xem hồ sơ" dẫn tới /profiles/{id}, kể cả hồ sơ chưa đồng thuận', () => {
    const html = renderToStaticMarkup(
      <ProfileCard profile={profile} onConsent={() => undefined} onDelete={() => undefined} />,
    );
    expect(html.match(/href="\/profiles\/p"/g)).toHaveLength(2);
    expect(html).toMatch(/href="\/profiles\/p"[^>]*>[^]*Mẹ[^]*<\/a>/);
    expect(html).toContain('Xem hồ sơ');
  });
  it.each([
    ['pending', 'attestation', 'Xác nhận đồng ý'],
    ['invited', 'attestation', 'Xác nhận đồng ý'],
    ['declined', 'attestation', 'Xác nhận đồng ý'],
    ['pending', 'self', 'Xác nhận đồng ý'],
    ['pending', 'invitation', 'Tạo link mời người thân'],
    ['invited', 'invitation', 'Quản lý link xác nhận'],
    ['withdrawn', 'invitation', 'Tạo link mời người thân'],
  ] as const)('TC-558: %s/action %s có nút %s', (consentStatus, consentAction, label) => {
    const html = renderToStaticMarkup(
      <ProfileCard
        profile={{ ...profile, consentStatus, consentAction }}
        onConsent={() => undefined}
        onDelete={() => undefined}
      />,
    );
    expect(html).toContain(label);
    if (consentAction !== 'invitation') expect(html).not.toContain('link');
  });
  it.each(['main_attested', 'self', 'invitation'] as const)(
    'TC-558: confirmed/%s không yêu cầu xác nhận lại',
    (consentSource) => {
      const html = renderToStaticMarkup(
        <ProfileCard
          profile={{ ...profile, consentSource, consentStatus: 'confirmed', consentAction: null }}
          onConsent={() => undefined}
          onDelete={() => undefined}
        />,
      );
      expect(html).toContain('Đã đồng ý chia sẻ');
      expect(html.match(/<button/g)).toHaveLength(1);
    },
  );
  it('TC-558: withdrawn không liên kết chỉ còn xóa; không cam kết hay gửi link', () => {
    const html = renderToStaticMarkup(
      <ProfileCard
        profile={{ ...profile, consentStatus: 'withdrawn', consentAction: null }}
        onConsent={() => undefined}
        onDelete={() => undefined}
      />,
    );
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).not.toContain('Xác nhận đồng ý');
    expect(html).not.toContain('link');
  });
});
describe('TC-382 — nút rút đồng thuận nằm trên thẻ hồ sơ của chính tài khoản', () => {
  const confirmed = { ...profile, consentStatus: 'confirmed' as const, consentAction: null };
  const render = (item: ProfileListItem, onWithdraw?: () => void) =>
    renderToStaticMarkup(
      <ProfileCard
        profile={item}
        onConsent={() => undefined}
        onDelete={() => undefined}
        onWithdraw={onWithdraw}
      />,
    );
  it('hồ sơ của mình đã đồng thuận: có nút "Rút đồng thuận"', () => {
    const html = render(confirmed, () => undefined);
    expect(html).toContain('Rút đồng thuận');
    expect(html).toMatch(/Rút đồng thuận<\/button>.*Xóa hồ sơ<\/button>(<\/div>)+<\/article>$/);
  });
  it('hồ sơ người khác hoặc chưa đồng thuận: không có nút', () => {
    expect(render(confirmed)).not.toContain('Rút đồng thuận');
    expect(render(profile, () => undefined)).not.toContain('Rút đồng thuận');
  });
});
