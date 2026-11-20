import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { HouseholdMemberRow } from './HouseholdMemberRow';

it('SPEC-066: hàng Chủ hộ và hàng Bạn không chọn được, có icon bảo vệ/khoá và không có nút bấm', () => {
  const html = renderToStaticMarkup(
    <ul>
      <HouseholdMemberRow
        member={{ accountId: 'owner-1', displayName: 'Ba Minh', role: 'main', isOwner: true, isSelf: false }}
        viewerRole="main"
        selected={false}
        onSelect={vi.fn()}
      />
      <HouseholdMemberRow
        member={{ accountId: 'self-1', displayName: 'Lan', role: 'main', isOwner: false, isSelf: true }}
        viewerRole="main"
        selected={false}
        onSelect={vi.fn()}
      />
    </ul>,
  );

  expect(html).not.toContain('<button');
  expect(html).toContain('Chủ hộ được bảo vệ');
  expect(html).toContain('Tài khoản của bạn');
  expect(html).toContain('>Bạn<');
});

it('E28-S3-T2b: hàng thành viên quản lý được là nút có aria-pressed và nhãn Đang chọn khi được chọn', () => {
  const html = renderToStaticMarkup(
    <ul>
      <HouseholdMemberRow
        member={{ accountId: 'hoa', displayName: 'Mẹ Hoa', role: 'member', isOwner: false, isSelf: false }}
        viewerRole="main"
        selected={true}
        onSelect={vi.fn()}
      />
    </ul>,
  );

  expect(html).toContain('<button');
  expect(html).toContain('aria-pressed="true"');
  expect(html).toContain('Đang chọn');
  expect(html).toContain('arrow_forward');
});

it('SPEC-066: người xem là thành viên thường không thấy nút bấm trên bất kỳ hàng nào', () => {
  const html = renderToStaticMarkup(
    <ul>
      <HouseholdMemberRow
        member={{ accountId: 'tuan', displayName: 'Anh Tuấn', role: 'main', isOwner: false, isSelf: false }}
        viewerRole="member"
        selected={false}
        onSelect={vi.fn()}
      />
    </ul>,
  );

  expect(html).not.toContain('<button');
  expect(html).toContain('Đồng quản lý');
});
