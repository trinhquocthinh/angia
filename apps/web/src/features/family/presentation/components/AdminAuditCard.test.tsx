import { renderToStaticMarkup } from 'react-dom/server';
import type { ComponentProps } from 'react';
import { expect, it } from 'vitest';
import { AdminAuditCard } from './AdminAuditCard';
type Props = ComponentProps<typeof AdminAuditCard>;
function markup(events: object) {
  return renderToStaticMarkup(
    <AdminAuditCard state={{ events, applyFilters: () => {} } as Props['state']} />,
  );
}
it('TC-841: bộ lọc đầy đủ 23 loại và trạng thái rỗng', () => {
  const html = markup({
    data: { pages: [{ items: [], nextCursor: null }] },
    isPending: false,
    isError: false,
  });
  for (const text of [
    'Từ ngày',
    'Đến ngày',
    'Loại sự kiện',
    'Mã nhà',
    'Mã tài khoản',
    'Áp dụng',
    'Xoá lọc',
    'Chưa có sự kiện nào khớp bộ lọc.',
    'admin-history.svg',
  ])
    expect(html).toContain(text);
  expect(html.match(/<option/g)).toHaveLength(24);
  expect(html).not.toContain('Tải thêm');
});
it('TC-841: đang tải không hiện trạng thái rỗng', () => {
  const html = markup({ isPending: true });
  expect(html).toContain('Đang tải nhật ký…');
  expect(html).not.toContain('Chưa có sự kiện');
});
it('TC-841: lỗi có thử lại', () =>
  expect(markup({ isError: true })).toContain('Không tải được nhật ký. Thử lại.'));
it('TC-841: có cursor hiện tải thêm, đang tải thì khoá nút', () => {
  const html = markup({
    data: { pages: [{ items: [], nextCursor: 'next' }] },
    hasNextPage: true,
    isFetchingNextPage: true,
  });
  expect(html).toContain('Tải thêm');
  expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Tải thêm/);
});
