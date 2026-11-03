import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ProfileLinkRow } from './ProfileLinkRow';
const candidates = [
  { id: 'n', displayName: 'Nam', isSystemAdmin: false, familyId: 'f', role: 'member' as const },
];
describe('TC-564 — Hàng liên kết trên /admin', () => {
  it('chỉ hiện tên, chưa đổi lựa chọn thì không có nút ghi', () => {
    const html = renderToStaticMarkup(
      <ProfileLinkRow
        profile={{ id: 'p', displayName: 'Mẹ', linkedAccount: { id: 'm', displayName: 'Mai' } }}
        candidates={candidates}
        pending={false}
        onChange={() => undefined}
      />,
    );
    expect(html).toContain('Mẹ');
    expect(html).toContain('Mai');
    expect(html).toContain('Nam');
    expect(html).toContain('Không liên kết');
    expect(html).not.toContain('<button');
    expect(html).not.toContain('Năm sinh');
  });
});
