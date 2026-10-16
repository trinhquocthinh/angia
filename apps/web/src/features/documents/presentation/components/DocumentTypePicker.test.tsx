import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DocumentTypePicker } from './DocumentTypePicker';

describe('Chọn loại giấy tờ khi tải lô ảnh (SPEC-008 declaredType tùy chọn)', () => {
  it('mặc định "AI tự nhận" được chọn và có lời giải thích cho lô trộn nhiều loại', () => {
    const html = renderToStaticMarkup(<DocumentTypePicker value={null} onChange={() => undefined} />);
    expect(html).toMatch(/aria-pressed="true"[^>]*>(<[^>]+>)*[^<]*AI tự nhận/);
    expect(html).toContain('Chọn nhiều loại giấy tờ trong một lần tải: để AI tự nhận từng ảnh.');
    expect(html).toContain('ảnh khác loại sẽ chuyển sang nhập tay');
  });

  it('đã chọn một loại thì chip đó sáng, "AI tự nhận" tắt (bấm để bỏ chọn)', () => {
    const html = renderToStaticMarkup(<DocumentTypePicker value="prescription" onChange={() => undefined} />);
    expect(html).toMatch(/aria-pressed="false"[^>]*>(<[^>]+>)*[^<]*AI tự nhận/);
    expect(html).toMatch(/aria-pressed="true"[^>]*>(<[^>]+>)*Đơn thuốc/);
  });
});
