import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { TextSizeProvider } from '@src/shared/accessibility/TextSizeProvider';
import { AccountTextSizeCard } from './AccountTextSizeCard';

it('Cỡ chữ: công tắc có nhãn và mặc định tắt', () => {
  const html = renderToStaticMarkup(
    <TextSizeProvider>
      <AccountTextSizeCard />
    </TextSizeProvider>,
  );
  expect(html).toContain('Cỡ chữ');
  expect(html).toContain('Chữ lớn');
  expect(html).toContain('role="switch"');
  expect(html).toContain('aria-checked="false"');
});
