import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { LabResult, LabSeries } from '@angia/contracts';
import { LabSeriesList } from './LabSeriesList';
vi.mock('@tanstack/react-router', () => ({ Link: ({ children }: { children: unknown }) => children }));

const result: LabResult = {
  id: 'a',
  healthProfileId: 'p',
  sourceDocumentId: 'doc',
  resultDate: '2026-01-05',
  testName: 'HbA1c',
  value: '7.3',
  unit: '%',
  referenceRange: '4.0 - 6.0',
  facility: 'BV Chợ Rẫy',
  manualWithoutSource: false,
  createdAt: '2026-01-05T08:00:00.000Z',
};
const series: LabSeries[] = [
  {
    testName: 'Creatinin',
    results: [{ ...result, id: 'c', testName: 'Creatinin', resultDate: '2026-10-01', referenceRange: null }],
  },
  { testName: 'HbA1c', results: [result, { ...result, id: 'b', resultDate: '2026-09-30', value: '7.1' }] },
];
const render = (props: Partial<Parameters<typeof LabSeriesList>[0]> = {}) =>
  renderToStaticMarkup(
    <LabSeriesList data={series} loading={false} error={false} retry={() => undefined} {...props} />,
  );

describe('Kết quả cận lâm sàng (Design §6, E5-S2-T1)', () => {
  it('TC-259 — thẻ từng chỉ số theo thứ tự API, lần mới nhất trên, khoảng tham chiếu nguyên văn phiếu', () => {
    const html = render();
    expect(html.indexOf('Creatinin')).toBeLessThan(html.indexOf('HbA1c'));
    expect(html.indexOf('30/09/2026')).toBeLessThan(html.indexOf('05/01/2026'));
    expect(html).toContain('2 lần');
    expect(html).toContain('Khoảng tham chiếu trên phiếu: 4.0 - 6.0');
    expect(html).toContain('Phiếu không in khoảng tham chiếu');
  });

  it('BR-033 — không có chữ nhận định hay đánh giá so với khoảng tham chiếu', () => {
    expect(render()).not.toMatch(/bình thường|bất thường|cao|thấp|tốt|xấu|cần chú ý/i);
  });

  it('rỗng, đang tải và lỗi tải', () => {
    expect(render({ data: [] })).toContain('Chưa có kết quả cận lâm sàng.');
    expect(render({ loading: true })).toContain('Đang tải kết quả xét nghiệm');
    expect(render({ error: true })).toContain('Không tải được kết quả xét nghiệm.');
  });
});
