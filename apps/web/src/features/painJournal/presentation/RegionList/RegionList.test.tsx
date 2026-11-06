import { bodyRegions } from '@angia/contracts';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RegionList } from './RegionList';

const noop = () => undefined;

describe('Danh sách chọn vùng cơ thể', () => {
  it('TC-720: có đủ 35 radio với nhãn theo contracts, không chọn sẵn', () => {
    const html = renderToStaticMarkup(<RegionList selected={null} onSelect={noop} />);
    expect(html.match(/type="radio"/g)).toHaveLength(35);
    expect(html).not.toContain('checked=""');
    for (const entry of Object.values(bodyRegions)) {
      for (const side of entry.sides) {
        const label = entry.label + (side === 'center' ? '' : ` · ${side === 'left' ? 'trái' : 'phải'}`);
        expect(html).toContain(`aria-label="${label}"`);
      }
    }
  });

  it('TC-720: nhóm Đầu và thân, Tay, Chân theo thiết kế đã chốt', () => {
    const html = renderToStaticMarkup(<RegionList selected={null} onSelect={noop} />);
    expect(html).toContain('<legend');
    expect(html).toContain('Chọn vùng cơ thể');
    expect(html).toContain('aria-label="Đầu và thân"');
    expect(html).toContain('aria-label="Tay"');
    expect(html).toContain('aria-label="Chân"');
    expect(html.indexOf('aria-label="Đầu và thân"')).toBeLessThan(html.indexOf('aria-label="Tay"'));
    expect(html.indexOf('aria-label="Tay"')).toBeLessThan(html.indexOf('aria-label="Chân"'));
  });

  it('TC-720: chỉ đánh dấu đúng cặp vùng và bên được truyền vào', () => {
    const html = renderToStaticMarkup(
      <RegionList selected={{ region: 'knee', side: 'left' }} onSelect={noop} />,
    );
    expect(html.match(/checked=""/g)).toHaveLength(1);
    expect(html).toMatch(/<input[^>]+aria-label="Đầu gối · trái"[^>]+checked=""/);
    expect(html).not.toMatch(/<input[^>]+aria-label="Đầu gối · phải"[^>]+checked=""/);
  });

  it('TC-720: hai danh sách độc lập không dùng chung nhóm radio', () => {
    const html = renderToStaticMarkup(
      <>
        <RegionList selected={null} onSelect={noop} />
        <RegionList selected={null} onSelect={noop} />
      </>,
    );
    const names = [...html.matchAll(/name="([^"]+)"/g)].map((match) => match[1]);
    expect(names).toHaveLength(70);
    expect(new Set(names).size).toBe(2);
  });
});
