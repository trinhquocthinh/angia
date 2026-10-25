import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { MyConsentProfile } from '../../application/myConsentPorts';
import { MyConsentCard } from './MyConsentCard';
import { WithdrawConsentDialog } from './WithdrawConsentDialog';
const base: MyConsentProfile = { id: 'p', displayName: 'Mẹ', consentStatus: 'confirmed', withdrawnAt: null };
const render = (profile: MyConsentProfile | null) =>
  renderToStaticMarkup(<MyConsentCard profile={profile} onWithdraw={() => undefined} />);
describe('TC-382 — thẻ đồng thuận của tài khoản liên kết', () => {
  it('confirmed: có tên hồ sơ và nút "Rút đồng thuận"', () => {
    const html = render(base);
    expect(html).toContain('Đồng thuận lưu thông tin sức khỏe');
    expect(html).toContain('Mẹ');
    expect(html).toContain('Rút đồng thuận');
    expect(html.match(/<button/g)).toHaveLength(1);
  });
  it('withdrawn: hiện giờ rút theo giờ Việt Nam và không có nút', () => {
    const html = render({ ...base, consentStatus: 'withdrawn', withdrawnAt: '2026-10-24T03:05:00Z' });
    expect(html).toContain('Bạn đã rút đồng thuận lúc 10:05, 24/10/2026.');
    expect(html).not.toContain('<button');
  });
  it.each(['invited', 'pending', 'declined'] as const)('%s: chỉ hiện trạng thái, không nút', (status) => {
    const html = render({ ...base, consentStatus: status });
    expect(html).toContain('Mẹ');
    expect(html).not.toContain('<button');
    expect(html).not.toContain('Rút đồng thuận');
  });
  it('profile null: không render gì', () => {
    expect(render(null)).toBe('');
  });
});
describe('TC-383 — hộp thoại rút đồng thuận', () => {
  it('có nguyên văn câu xác nhận kèm tên hồ sơ và hai nút', () => {
    const html = renderToStaticMarkup(
      <WithdrawConsentDialog
        name="Mẹ"
        pending={false}
        failure={null}
        onConfirm={() => undefined}
        onCancel={() => undefined}
      />,
    );
    const text = html.replace(/<[^>]+>/g, '');
    expect(text).toContain(
      'Sau khi rút, AN GIA ngừng lưu thêm, ngừng nhắc thuốc và ẩn thông tin sức khỏe của hồ sơ Mẹ với mọi người trong gia đình. Dữ liệu đã lưu chưa bị xóa; muốn xóa hẳn, hãy nhờ người quản lý gia đình xóa hồ sơ.',
    );
    expect(html).toContain('>Rút đồng thuận</button>');
    expect(html).toContain('>Giữ nguyên</button>');
  });
  it('hiện lỗi khi rút thất bại', () => {
    const html = renderToStaticMarkup(
      <WithdrawConsentDialog
        name="Mẹ"
        pending={false}
        failure="Lỗi"
        onConfirm={() => undefined}
        onCancel={() => undefined}
      />,
    );
    expect(html).toContain('role="alert"');
  });
});
