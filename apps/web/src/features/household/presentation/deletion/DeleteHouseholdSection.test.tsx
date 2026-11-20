import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { DeleteHouseholdSection } from './DeleteHouseholdSection';

it('SPEC-069: còn thành viên khác hiện số thành viên thật và nút Xoá nhà mờ, không có nút xem modal', () => {
  const html = renderToStaticMarkup(
    <DeleteHouseholdSection
      familyName="Nhà Ngọc Lan"
      otherCount={2}
      pendingDeletion={null}
      pending={false}
      error={null}
      onRequest={vi.fn()}
      onRevoke={vi.fn()}
      onClearError={vi.fn()}
    />,
  );

  expect(html).toContain('VÙNG NGUY HIỂM');
  expect(html).toContain('Hiện tại nhà còn 2 thành viên khác.');
  expect(html).toMatch(/<button[^>]*disabled=""[^>]*>[\s\S]*?Xoá nhà \(Còn thành viên khác\)/);
  expect(html).not.toContain('Xem modal xoá nhà');
});

it('SPEC-069: khi có yêu cầu xoá đang chờ hiện băng hẹn giờ thật và nút Thu hồi yêu cầu xoá', () => {
  const executeAt = new Date(2026, 10, 20, 14, 30).toISOString();
  const html = renderToStaticMarkup(
    <DeleteHouseholdSection
      familyName="Nhà Ngọc Lan"
      otherCount={0}
      pendingDeletion={{ id: 'del-1', status: 'pending', executeAt }}
      pending={false}
      error={null}
      onRequest={vi.fn()}
      onRevoke={vi.fn()}
      onClearError={vi.fn()}
    />,
  );

  expect(html).toContain('Nhà sẽ bị xoá lúc');
  expect(html).toContain('20/11/2026 14:30');
  expect(html).toContain('Thu hồi yêu cầu xoá');
});
