import { renderToStaticMarkup } from 'react-dom/server';
import type { ComponentProps } from 'react';
import { expect, it } from 'vitest';
import { FoundingInvitationsCard } from './FoundingInvitationsCard';

type Props = ComponentProps<typeof FoundingInvitationsCard>;
const issued = {
  invitationId: 'id',
  code: 'AN-REAL-CODE',
  link: 'https://angia.test/invite#secret-token',
  expiresAt: '2026-12-01T18:00:00Z',
};
function markup(items: Props['items'] = [], options = { pending: false, error: false, notice: '' }) {
  const props = {
    items,
    notice: options.notice,
    create: { isPending: options.pending, isError: options.error },
    revoke: { isPending: false },
  } as unknown as Props;
  return renderToStaticMarkup(<FoundingInvitationsCard {...props} />);
}
it('SPEC-065: chưa tạo lời mời chỉ hiện nút tạo, cảnh báo một lần và đúng icon', () => {
  const html = markup();
  expect(html).toContain('aria-label="Lời mời lập nhà"');
  expect(html).toContain('Tạo lời mời lập nhà');
  expect(html).toContain('Link và mã chỉ hiện một lần; tải lại trang sẽ không xem lại được.');
  for (const name of ['vpn_key', 'add'])
    expect(html).toMatch(new RegExp(`<img[^>]*src="/images/household/stitch/admin-${name}.svg"`));
  expect(html).not.toContain(issued.code);
  expect(html).not.toContain(issued.link);
  expect(html).not.toContain('<input');
  expect(html).not.toContain('Sao chép');
  expect(html).not.toContain('Thu hồi');
});
it('SPEC-065: lời mời có mã/link thật, ngày Việt Nam và nhãn sao chép', () => {
  const html = markup([issued]);
  expect(html).toContain(issued.code);
  expect(html).toContain(`value="${issued.link}"`);
  expect(html).toContain('readOnly=""');
  expect(html).toContain('Hết hạn 02/12/2026');
  expect(html).toContain('aria-label="Sao chép link"');
  expect(html).toContain('aria-label="Sao chép mã"');
  expect(html).toContain('Thu hồi');
  expect(html).not.toContain('<dialog');
});
it('SPEC-065: đang tạo khoá nút và không dựng lời mời giả', () => {
  const html = markup([], { pending: true, error: false, notice: '' });
  expect(html).toMatch(/<button[^>]*disabled=""/);
  expect(html).toContain('Đang tạo lời mời…');
  expect(html).not.toContain('<input');
});
it('SPEC-065: lỗi tạo có cảnh báo; kết quả thu hồi có vai trò trạng thái', () => {
  const html = markup([], { pending: false, error: true, notice: 'Lời mời này không còn hiệu lực.' });
  expect(html).toContain('role="alert"');
  expect(html).toContain('Không tạo được lời mời. Thử lại sau.');
  expect(html).toContain('role="status"');
  expect(html).toContain('Lời mời này không còn hiệu lực.');
});
