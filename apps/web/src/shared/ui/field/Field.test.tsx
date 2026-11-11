import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { Field } from './Field';

it('liên kết nhãn, lỗi và hướng dẫn mà không mất mô tả từ caller', () => {
  const html = renderToStaticMarkup(
    <Field
      id="name"
      label="Tên thuốc"
      hint="Theo đơn"
      error="Cần nhập tên"
      aria-describedby="extra"
      required
    />,
  );
  expect(html).toContain('for="name"');
  expect(html).toContain('aria-invalid="true"');
  expect(html).toContain('aria-describedby="extra name-hint name-error"');
  expect(html).toContain('id="name-error"');
  expect(html).toContain('role="alert"');
  expect(html).toContain('required=""');
});
it('tự tạo ID khi caller không truyền, không báo lỗi khi hợp lệ', () => {
  const html = renderToStaticMarkup(<Field label="Tên thuốc" hint="Theo đơn" />);
  const id = html.match(/<input[^>]*id="([^"]+)"/)![1];
  expect(html).toContain(`for="${id}"`);
  expect(html).toContain(`aria-describedby="${id}-hint"`);
  expect(html).not.toContain('aria-invalid=');
  expect(html).not.toContain('role="alert"');
});
