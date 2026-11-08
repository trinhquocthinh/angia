import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BodyMap2D } from './BodyMap2D';
import { FrontSvg } from './front.svg';
import { BackSvg } from './back.svg';

const noop = () => undefined;

describe('Hình chọn vùng cơ thể 2D', () => {
  it('F-34: mở ở mặt trước, không chọn sẵn vùng và giải thích hướng trái/phải', () => {
    const html = renderToStaticMarkup(<BodyMap2D selected={null} onSelect={noop} />);
    expect(html).toContain('aria-pressed="true">Mặt trước</button>');
    expect(html).toContain('aria-pressed="false">Mặt sau</button>');
    expect(html).toContain('Trái, phải theo người trong hình');
    expect(html).not.toContain('Đã chọn:');
    expect(html.indexOf('>Phải</span>')).toBeLessThan(html.indexOf('>Trái</span>'));
  });

  it('F-34: hiện nhãn đầy đủ và trạng thái vùng đã chọn', () => {
    const html = renderToStaticMarkup(
      <BodyMap2D selected={{ region: 'knee', side: 'left' }} onSelect={noop} />,
    );
    expect(html).toContain('Đã chọn: Đầu gối · trái');
    expect(html).toMatch(/aria-label="Đầu gối · trái" aria-pressed="true"/);
    expect(html).toMatch(/aria-label="Đầu gối · phải" aria-pressed="false"/);
  });

  it('F-34: giữ nhãn vùng đã chọn dù vùng đó chỉ có ở mặt sau', () => {
    const html = renderToStaticMarkup(
      <BodyMap2D selected={{ region: 'lower_back', side: 'center' }} onSelect={noop} />,
    );
    expect(html).toContain('Đã chọn: Thắt lưng');
    expect(html).not.toContain('Thắt lưng ·');
  });

  it.each([
    [FrontSvg, 'Ngực', 'Lưng trên', 'translate(320 0) scale(-1 1)'],
    [BackSvg, 'Lưng trên', 'Ngực', undefined],
  ] as const)('F-34: SVG có nhãn vùng đúng mặt và tô đúng bên trái', (Figure, shown, hidden, transform) => {
    const html = renderToStaticMarkup(<Figure selected={{ region: 'knee', side: 'left' }} onSelect={noop} />);
    expect(html).toContain(`aria-label="${shown}"`);
    expect(html).not.toContain(`aria-label="${hidden}"`);
    expect(html).toMatch(/<button[^>]+aria-label="Đầu gối · trái" aria-pressed="true"/);
    const leftKnee = html.match(/<path[^>]+data-body-region="knee\/left"[^>]*>/)?.[0];
    expect(leftKnee).toBeDefined();
    if (transform) expect(leftKnee).toContain(`transform="${transform}"`);
    else expect(leftKnee).not.toContain('transform=');
  });

  it('TC-721: chấm và nhãn theo dõi khớp cả vùng lẫn bên, không tự chọn vùng', () => {
    const html = renderToStaticMarkup(
      <BodyMap2D selected={null} onSelect={noop} trackingLocations={[{ region: 'knee', side: 'left' }]} />,
    );
    expect(html).toContain('aria-label="Đầu gối · trái · đang theo dõi" aria-pressed="false"');
    expect(html).toContain('aria-label="Đầu gối · phải" aria-pressed="false"');
    expect(html.match(/data-tracking-dot/g)).toHaveLength(1);
    expect(html).not.toContain('Đã chọn:');
  });

  it('TC-721: bỏ prop theo dõi thì không hiện chấm hoặc nhãn trạng thái', () => {
    const html = renderToStaticMarkup(<BodyMap2D selected={null} onSelect={noop} />);
    expect(html).not.toContain('data-tracking-dot');
    expect(html).not.toContain('đang theo dõi');
  });
});
