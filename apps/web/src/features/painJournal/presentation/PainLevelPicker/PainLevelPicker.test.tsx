import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { PainLevelPicker } from './PainLevelPicker';

it('TC-723 — có hướng dẫn ba nhóm, mốc 10 và mô tả truy cập cho bộ chọn', () => {
  const html = renderToStaticMarkup(<PainLevelPicker value={null} onChange={() => undefined} />);
  expect(html.match(/type="radio"/g)).toHaveLength(10);
  expect(html).not.toContain('checked=""');
  for (const label of [
    'Hướng dẫn chọn mức đau',
    '1–3',
    'Đau nhẹ',
    '4–6',
    'Đau trung bình',
    '7–10',
    'Đau nặng',
    'Đau dữ dội nhất bạn có thể hình dung.',
    'Chọn theo cảm nhận của chính bạn lúc này.',
  ])
    expect(html).toContain(label);
  const describedBy = html.match(/aria-describedby="([^"]+)"/)![1];
  expect(html).toContain(`id="${describedBy}"`);
});
it('TC-723 — hướng dẫn tĩnh, radio và giá trị được chọn vẫn chỉ mang con số', () => {
  const html = renderToStaticMarkup(<PainLevelPicker value={6} onChange={() => undefined} />);
  expect(html.match(/checked=""/g)).toHaveLength(1);
  expect(html).toContain('aria-label="6"');
  expect(html).not.toContain('6/10 · Đau trung bình');
  expect(html).not.toMatch(/thuốc giảm đau|liều mạnh|cần được can thiệp/);
});
