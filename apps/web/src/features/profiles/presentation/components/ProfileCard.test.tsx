import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ProfileCard } from './ProfileCard';
import { consentMessage } from '../consentMessage';
const profile = {
  id: 'p',
  familyId: 'f',
  displayName: 'Mẹ',
  birthYear: 1954,
  consentConfirmedAt: null,
  consentConfirmedBy: null,
  consentBasis: null,
  createdAt: '2026-10-06T00:00:00Z',
};
describe('Trạng thái hồ sơ và đồng thuận', () => {
  it('hiển thị năm sinh và nút xác nhận, không suy diễn tuổi hoặc dữ liệu y tế', () => {
    const html = renderToStaticMarkup(<ProfileCard profile={profile} onConsent={() => undefined} />);
    expect(html).toContain('Năm sinh 1954');
    expect(html).toContain('Chưa xác nhận đồng thuận');
    expect(html).toContain('Xác nhận đồng thuận');
    expect(html).not.toContain('tuổi');
    expect(html).not.toContain('mmHg');
  });
  it('hồ sơ đã xác nhận không có nút xác nhận mới', () => {
    const html = renderToStaticMarkup(
      <ProfileCard
        profile={{ ...profile, consentConfirmedAt: '2026-10-06T00:00:00Z' }}
        onConsent={() => undefined}
      />,
    );
    expect(html).toContain('Đã xác nhận đồng thuận');
    expect(html).not.toContain('<button');
  });
  it('phân biệt ghi nhận lần đầu và yêu cầu lặp, không hiển thị ID tài khoản', () => {
    const response = {
      profile: { ...profile, consentConfirmedAt: '2026-10-06T00:00:00Z' },
      confirmedByDisplayName: 'Thịnh',
      outcome: 'already_confirmed' as const,
    };
    expect(consentMessage(response)).toContain('Thịnh');
    expect(consentMessage(response)).toContain('không được ghi thêm');
    expect(consentMessage({ ...response, confirmedByDisplayName: null })).not.toContain('Thịnh');
    expect(consentMessage({ ...response, outcome: 'confirmed' })).toBe(
      'Đã ghi nhận xác nhận đồng thuận của bạn.',
    );
  });
});
