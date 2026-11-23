import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { ThemeContext, type ThemePreference } from './ThemeContext';
import { ThemeSwitch } from './ThemeSwitch';

it.each(['light', 'dark', 'system'] as const)(
  'điều khiển nền dùng lựa chọn %s từ ThemeProvider ở cả hai cách trình bày',
  (preference: ThemePreference) => {
    for (const appearance of ['default', 'account'] as const) {
      const html = renderToStaticMarkup(
        <ThemeContext value={{ preference, setPreference: vi.fn() }}>
          <ThemeSwitch appearance={appearance} renderIcon={(value) => <i data-icon={value} />} />
        </ThemeContext>,
      );
      expect(html.match(/type="radio"/g)).toHaveLength(3);
      expect(html.match(/checked=""/g)).toHaveLength(1);
      const selected = html.match(/<input[^>]*checked=""[^>]*>/)?.[0];
      expect(selected).toContain(`value="${preference}"`);
      for (const label of ['Sáng', 'Tối', 'Theo máy']) expect(html).toContain(label);
      expect(html).toContain(`data-icon="${preference}"`);
    }
  },
);
