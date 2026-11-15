import { expect, it } from 'vitest';
import { parseCurrentLegal } from './parseCurrentLegal';
const document = {
  id: '11111111-1111-4111-8111-111111111111',
  kind: 'terms',
  version: '1',
  publishedAt: '2026-11-01T00:00:00Z',
  material: true,
  url: '/legal/terms.md',
};
it('nhận đúng hai bản legal từ API', () => {
  const data = { terms: document, privacy: { ...document, kind: 'privacy' } };
  expect(parseCurrentLegal(data)).toEqual(data);
});
it.each([null, {}, { terms: document }, { terms: document, privacy: document }])(
  'thiếu dữ liệu hoặc sai loại phải tải lại',
  (value) => {
    expect(parseCurrentLegal(value)).toBeNull();
  },
);
it.each(['javascript:alert(1)', '//example.com', '/\\example.com', '/legal/ sai'])(
  'không dùng đường dẫn không hợp lệ %s',
  (url) => {
    expect(
      parseCurrentLegal({ terms: { ...document, url }, privacy: { ...document, kind: 'privacy' } }),
    ).toBeNull();
  },
);
it('không dùng ID legal sai UUID từ details.current', () => {
  expect(
    parseCurrentLegal({
      terms: { ...document, id: 'không phải UUID' },
      privacy: { ...document, kind: 'privacy' },
    }),
  ).toBeNull();
});
