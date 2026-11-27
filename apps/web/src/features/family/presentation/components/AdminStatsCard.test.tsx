import { renderToStaticMarkup } from 'react-dom/server';
import type { ComponentProps } from 'react';
import { expect, it } from 'vitest';
import { AdminStatsCard } from './AdminStatsCard';
type Props = ComponentProps<typeof AdminStatsCard>;
const weeks = Array.from({ length: 12 }, (_, i) => ({
  weekStart: `2026-11-${String(23 - i).padStart(2, '0')}`,
  families: 12 + i,
  accounts: 38 + i,
  familiesWithDoseConfirmation: 7 + i,
  familiesActiveStreak4w: 3 + i,
}));
function markup(state: object) {
  return renderToStaticMarkup(<AdminStatsCard state={state as Props['state']} />);
}
it('TC-844: bốn số tuần hiện tại và bảng đủ 12 dòng có tiêu đề truy cập', () => {
  const html = markup({ data: { weeks }, isPending: false, isError: false });
  for (const text of [
    'Tổng số nhà',
    'Tài khoản hoạt động',
    'Nhà có xác nhận liều tuần này',
    'Nhà dùng đều từ 4 tuần',
    'Số liệu theo tuần (thứ Hai – Chủ nhật, giờ Việt Nam)',
    '23/11/2026',
    'admin-analytics.svg',
    'overflow-x-auto',
  ])
    expect(html).toContain(text);
  expect(html.match(/<tbody>[\s\S]*?<\/tbody>/)?.[0].match(/<tr/g)).toHaveLength(12);
  expect(html.match(/<dt/g)).toHaveLength(4);
  expect([...html.matchAll(/<dd[^>]*>([^<]*)<\/dd>/g)].map((match) => match[1])).toEqual([
    '12',
    '38',
    '7',
    '3',
  ]);
  for (const text of ['Lượt quét', 'Tỷ lệ lỗi']) expect(html).not.toContain(text);
  expect(html).toContain('scope="col"');
  expect(html).toContain('scope="row"');
});
it('TC-844: đang tải thông báo trạng thái', () =>
  expect(markup({ isPending: true })).toContain('Đang tải thống kê…'));
it('TC-844: lỗi ẩn dữ liệu cache và cho thử lại', () => {
  const html = markup({ data: { weeks }, isError: true });
  expect(html).toContain('Không tải được thống kê. Thử lại.');
  expect(html).toContain('Thử lại');
  expect(html).not.toContain('<table');
});
