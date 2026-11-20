import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { LeaveHouseholdSection } from './LeaveHouseholdSection';

it('SPEC-067: Chủ hộ khi còn người khác thấy cảnh báo trao quyền và nút Rời nhà mờ', () => {
  const html = renderToStaticMarkup(
    <LeaveHouseholdSection
      familyName="Nhà Ngọc Lan"
      isOwner={true}
      otherCount={2}
      pending={false}
      error={null}
      errorCode={null}
      onLeave={vi.fn()}
      onClearError={vi.fn()}
      onScrollToDelete={vi.fn()}
    />,
  );

  expect(html).toContain('Hãy trao quyền Chủ hộ cho người khác trước khi rời nhà.');
  expect(html).toContain('Rời nhà (Đang là Chủ hộ)');
  expect(html).not.toContain('Xem modal rời nhà');
});

it('SPEC-067: Chủ hộ ở một mình thấy thông báo xoá nhà thay vì rời nhà', () => {
  const html = renderToStaticMarkup(
    <LeaveHouseholdSection
      familyName="Nhà Ngọc Lan"
      isOwner={true}
      otherCount={0}
      pending={false}
      error={null}
      errorCode={null}
      onLeave={vi.fn()}
      onClearError={vi.fn()}
      onScrollToDelete={vi.fn()}
    />,
  );

  expect(html).toContain('Bạn là người duy nhất trong nhà. Hãy xoá nhà thay vì rời nhà.');
  expect(html).toContain('Đi tới mục Xoá nhà');
});

it('SPEC-067: thành viên thường thấy nút Rời nhà kích hoạt được', () => {
  const html = renderToStaticMarkup(
    <LeaveHouseholdSection
      familyName="Nhà Ngọc Lan"
      isOwner={false}
      otherCount={2}
      pending={false}
      error={null}
      errorCode={null}
      onLeave={vi.fn()}
      onClearError={vi.fn()}
      onScrollToDelete={vi.fn()}
    />,
  );

  expect(html).toContain('>Rời nhà<');
  expect(html).not.toContain('Rời nhà (Đang là Chủ hộ)');
});
