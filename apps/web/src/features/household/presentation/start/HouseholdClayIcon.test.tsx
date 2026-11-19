import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HouseholdClayIcon } from './HouseholdClayIcon';

describe('Biểu tượng clay màn Bắt đầu', () => {
  it.each(['house', 'invite', 'family'] as const)('dùng SVG gốc %s và ẩn ảnh trang trí', (name) => {
    const html = renderToStaticMarkup(<HouseholdClayIcon name={name} />);
    expect(html).toContain(`src="/images/household/clay/${name}.svg"`);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('alt=""');
    const size = name === 'family' ? 20 : 44;
    expect(html).toContain(`width="${size}" height="${size}"`);
  });
});
