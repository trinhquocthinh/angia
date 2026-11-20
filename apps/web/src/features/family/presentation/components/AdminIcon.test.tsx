import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { AdminIcon } from './AdminIcon';

it('hiển thị biểu tượng lưu khi font Material hiện tại chưa có glyph save', () => {
  const html = renderToStaticMarkup(<AdminIcon name="save" size={20} />);
  expect(html).toContain('<svg');
  expect(html).toContain('viewBox="0 0 24 24"');
  expect(html).toContain('aria-hidden="true"');
});
