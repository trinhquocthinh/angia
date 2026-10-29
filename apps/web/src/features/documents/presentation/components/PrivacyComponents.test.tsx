import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrivacyCanvas } from './PrivacyCanvas';
import { PrivacyRectangleFields } from './PrivacyRectangleFields';
const noop = () => undefined;
describe('Giao diện trình che ảnh trên máy', () => {
  it('TC-218: sửa bằng bàn phím có nhãn và giới hạn số vùng trong ảnh', () => {
    const text = renderToStaticMarkup(
      <PrivacyRectangleFields
        label="Vùng cắt"
        rectangle={{ left: 0, top: 0, width: 1000000, height: 1000000 }}
        disabled={false}
        onChange={noop}
      />,
    );
    expect(text.match(/inputMode="decimal"/g)).toHaveLength(4);
    expect(text).toContain('Vùng cắt — Trái');
    expect(text).toContain('max="100"');
  });
  it('TC-219: khung thao tác hiện ảnh trên máy (object URL) và overlay hình chữ nhật', () => {
    const text = renderToStaticMarkup(
      <PrivacyCanvas
        src="blob:anh-tren-may"
        edits={{ rotation: 90, crop: { left: 100000, top: 0, width: 800000, height: 1000000 }, masks: [] }}
        mode="mask"
        disabled={false}
        onBegin={noop}
        onRectangle={noop}
        onPreview={noop}
      />,
    );
    expect(text).toContain('src="blob:anh-tren-may"');
    expect(text).not.toContain('/api/');
    expect(text).toContain('aria-label="Vùng chỉnh ảnh"');
    expect(text).toContain('viewBox="0 0 1000000 1000000"');
  });
});
