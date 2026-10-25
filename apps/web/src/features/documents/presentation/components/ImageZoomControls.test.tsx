import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ImageZoomControls } from './ImageZoomControls';

const noop = () => undefined;
const render = (mode: 'fit' | 'width' | 'custom', scale: number) =>
  renderToStaticMarkup(
    <ImageZoomControls
      scale={scale}
      mode={mode}
      disabled={false}
      onFitPage={noop}
      onFitWidth={noop}
      onZoom={noop}
    />,
  );

describe('Thanh phóng to ảnh chứng từ', () => {
  it('mặc định "Vừa ngang" được chọn và hiển thị 100%', () => {
    const html = render('width', 1);
    expect(html).toMatch(/aria-pressed="true"[^>]*>Vừa ngang/);
    expect(html).toMatch(/aria-pressed="false"[^>]*>Vừa khung/);
    expect(html).toContain('100%');
  });

  it('phóng tay thì bỏ chọn hai chế độ nhanh, hiển thị tỉ lệ làm tròn', () => {
    const html = render('custom', 1.5625);
    expect(html).not.toContain('aria-pressed="true"');
    expect(html).toContain('156%');
    expect(html).toContain('aria-label="Phóng to ảnh"');
    expect(html).toContain('aria-label="Thu nhỏ ảnh"');
  });
});
