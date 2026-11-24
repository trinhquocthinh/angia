import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { AccountDataExportCard } from '@src/features/account/presentation/settings/AccountDataExportCard';

const baseProps = {
  phase: 'idle' as const,
  options: [] as { value: string; label: string }[],
  selectedScope: 'self',
  actionLabel: 'Tải dữ liệu của tôi',
  downloadUrl: null as string | null,
  onSelectScope: vi.fn(),
  onStartExport: vi.fn(),
};

it('TC-819: thành viên không thấy ô chọn hồ sơ và thấy đúng mô tả, nút tải cùng icon chuẩn', () => {
  const html = renderToStaticMarkup(<AccountDataExportCard {...baseProps} />);
  expect(html).toContain('Dữ liệu của tôi');
  expect(html).toContain('Tải về dữ liệu tài khoản và dữ liệu sức khoẻ của hồ sơ liên kết với bạn.');
  expect(html).toContain('Tải dữ liệu của tôi');
  expect(html).toContain('account-download-3d.svg');
  expect(html).not.toContain('Hồ sơ cần tải');
  expect(html).not.toContain('<select');
  for (const forbidden of ['Sẵn sàng xuất', 'JSON', 'PDF', 'GDPR', '30 ngày', 'Quyền quản trị']) {
    expect(html).not.toContain(forbidden);
  }
});

it('TC-820: Chủ hộ thấy ô chọn Hồ sơ cần tải và đổi nút sang Tải dữ liệu hồ sơ', () => {
  const html = renderToStaticMarkup(
    <AccountDataExportCard
      {...baseProps}
      options={[
        { value: 'self', label: 'Dữ liệu của tôi' },
        { value: 'prof-child', label: 'Bé An' },
      ]}
      selectedScope="prof-child"
      actionLabel="Tải dữ liệu hồ sơ"
    />,
  );
  expect(html).toContain('Hồ sơ cần tải');
  expect(html).toContain('Dữ liệu của tôi');
  expect(html).toContain('Bé An');
  expect(html).toContain('Tải dữ liệu hồ sơ');
});

it('hiển thị đúng trạng thái đang tạo, sẵn sàng, quá giới hạn và lỗi', () => {
  const pendingHtml = renderToStaticMarkup(<AccountDataExportCard {...baseProps} phase="pending" />);
  expect(pendingHtml).toContain('Đang tạo tệp…');
  expect(pendingHtml).toContain('Việc này có thể mất ít phút. Bạn có thể ở lại trang này.');
  expect(pendingHtml).toContain('account-spinner.svg');
  expect(pendingHtml).toContain('disabled=""');

  const readyHtml = renderToStaticMarkup(
    <AccountDataExportCard {...baseProps} phase="ready" downloadUrl="/api/me/data-exports/exp-1/file" />,
  );
  expect(readyHtml).toContain('Tệp ZIP đã sẵn sàng.');
  expect(readyHtml).toContain('Liên kết hết hạn sau 24 giờ.');
  expect(readyHtml).toContain('Tải tệp ZIP');
  expect(readyHtml).toContain('href="/api/me/data-exports/exp-1/file"');
  expect(readyHtml).toContain('account-check_circle.svg');
  expect(readyHtml).toContain('account-download.svg');

  const rateLimitedHtml = renderToStaticMarkup(<AccountDataExportCard {...baseProps} phase="rate_limited" />);
  expect(rateLimitedHtml).toContain('Bạn thao tác quá nhanh, vui lòng thử lại sau.');
  expect(rateLimitedHtml).toContain('Tải dữ liệu của tôi');
  expect(rateLimitedHtml).toContain('account-warning.svg');

  const failedHtml = renderToStaticMarkup(<AccountDataExportCard {...baseProps} phase="failed" />);
  expect(failedHtml).toContain('Chưa tạo được tệp dữ liệu. Vui lòng thử lại.');
  expect(failedHtml).toContain('Thử lại');
  expect(failedHtml).toContain('account-error.svg');
  expect(failedHtml).toContain('account-refresh.svg');
});
