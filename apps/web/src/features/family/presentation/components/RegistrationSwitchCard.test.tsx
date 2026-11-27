import { renderToStaticMarkup } from 'react-dom/server';
import type { ComponentProps } from 'react';
import { expect, it } from 'vitest';
import { RegistrationSwitchCard } from './RegistrationSwitchCard';

type Props = ComponentProps<typeof RegistrationSwitchCard>;
function markup(data?: { registrationOpen: boolean }, isError = false, pending = false) {
  const props = {
    registration: { data, isError },
    save: { isPending: pending, error: null },
  } as unknown as Props;
  return renderToStaticMarkup(<RegistrationSwitchCard {...props} />);
}
it.each([true, false])(
  'TC-832/833: hiện giá trị %s, nhãn truy cập và đúng icon đăng ký',
  (registrationOpen) => {
    const html = markup({ registrationOpen });
    expect(html).toContain('aria-label="Mở đăng ký công khai"');
    expect(html).toContain('role="switch"');
    expect(html).toContain('aria-label="Cho phép tự đăng ký"');
    expect(html).toContain(`aria-checked="${registrationOpen}"`);
    expect(html).toMatch(/<img[^>]*src="\/images\/household\/stitch\/admin-how_to_reg.svg"/);
    expect(html).not.toContain('<dialog');
  },
);
it('TC-832: đang tải không dựng công tắc giả', () => {
  const html = markup();
  expect(html).toContain('role="status"');
  expect(html).toContain('Đang tải trạng thái đăng ký…');
  expect(html).not.toContain('role="switch"');
});
it('TC-832: tải lỗi có cảnh báo và Thử lại, không hiện công tắc từ cache cũ', () => {
  const html = markup({ registrationOpen: true }, true);
  expect(html).toContain('role="alert"');
  expect(html).toContain('Thử lại');
  expect(html).not.toContain('role="switch"');
});
it('TC-833: đang lưu khoá công tắc và vẫn giữ giá trị cũ', () => {
  const html = markup({ registrationOpen: true }, false, true);
  expect(html).toMatch(/<button[^>]*role="switch"[^>]*disabled=""/);
  expect(html).toContain('aria-checked="true"');
});
