import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Arrow3d } from './Arrow3d';

describe('Mũi tên điều hướng 3D', () => {
  it.each([
    ['right', 'm9 5 7 7-7 7'],
    ['left', 'm15 5-7 7 7 7'],
  ] as const)('hiển thị đúng hướng %s và nét chevron', (direction, path) => {
    const html = renderToStaticMarkup(<Arrow3d direction={direction} />);
    expect(html).toContain(`data-direction="${direction}"`);
    expect(html).toContain(`d="${path}"`);
    expect(html).toContain('stroke="currentColor"');
  });

  it('ẩn toàn bộ biểu tượng trang trí khỏi trình đọc màn hình', () => {
    const html = renderToStaticMarkup(<Arrow3d />);
    expect(html).toMatch(/^<span[^>]*aria-hidden="true"/);
    expect(html).toContain('focusable="false"');
    expect(html).not.toContain('<title');
  });

  it.each([20, 24, 40])('giữ đường kính %i px và chevron bằng 55%% đường kính', (size) => {
    const html = renderToStaticMarkup(<Arrow3d size={size} />);
    expect(html).toContain(`width:${size}px;height:${size}px`);
    expect(html).toContain('width="55%" height="55%"');
  });

  it('mặc định hướng phải, cỡ 20 px và không thu nhỏ dưới 20 px', () => {
    expect(renderToStaticMarkup(<Arrow3d />)).toContain('data-direction="right"');
    expect(renderToStaticMarkup(<Arrow3d />)).toContain('width:20px;height:20px');
    expect(renderToStaticMarkup(<Arrow3d size={16} />)).toContain('width:20px;height:20px');
  });
});
