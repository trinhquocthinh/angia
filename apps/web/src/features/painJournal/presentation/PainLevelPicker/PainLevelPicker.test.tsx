import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { PainLevelPicker } from './PainLevelPicker';

it('TC-723 — có 10 mức, không chọn sẵn và không diễn giải mức đau', () => {
  const html = renderToStaticMarkup(<PainLevelPicker value={null} onChange={() => undefined} />);
  expect(html.match(/type="radio"/g)).toHaveLength(10);
  expect(html).not.toContain('checked=""');
  expect(html).toContain('Chấm theo cảm nhận của bạn, từ 1 đến 10.');
  expect(html).not.toMatch(/bất thường|nghiêm trọng|nhẹ|nặng/);
  const selected = renderToStaticMarkup(<PainLevelPicker value={6} onChange={() => undefined} />);
  expect(selected.match(/checked=""/g)).toHaveLength(1);
});
