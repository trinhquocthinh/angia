import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { forbiddenWords } from '@angia/contracts';
import { PainChartContent } from './PainChartContent';
import { PainIssueCard } from '../PainIssueCard/PainIssueCard';
import { PainIssueDetailHeader } from '../PainIssueDetail/PainIssueDetailHeader';
import { PainEntryList } from '../PainIssueDetail/PainEntryList';
import { issue } from '../../test/painIssues.test-helper';
const range = { from: '2026-11-01', to: '2026-11-30' };
const entries = [1, 10].map((level, i) => ({
  id: String(i),
  level,
  recordedAt: `2026-11-0${i + 1}T03:00:00Z`,
  note: null,
  createdBy: null,
  updatedBy: null,
  updatedAt: issue.updatedAt,
}));
it('dưới 4 lần ghi hiện thẻ mới nhất trước và bảng ẩn đúng dữ liệu', () => {
  const html = renderToStaticMarkup(
    <PainChartContent entries={entries} range={range} weeks={12} location="Đầu gối · trái" />,
  );
  expect(html).toContain('Cần ít nhất 4 lần ghi trong 12 tuần để vẽ biểu đồ.');
  expect(html.indexOf('02/11/2026')).toBeLessThan(html.indexOf('01/11/2026'));
  expect(html).toContain('class="sr-only"');
  expect(html).toContain('Đầu gối · trái từ 01/11/2026 đến 30/11/2026: 2 lần ghi.');
  expect(html).not.toContain('aria-hidden="true"');
});
it('TC-725 — nội dung hệ thống ở danh sách, chi tiết, biểu đồ và thẻ không có từ nhận định', () => {
  for (const level of [1, 10]) {
    const current = { ...issue, title: null, lastEntry: { ...issue.lastEntry, level } };
    const html = renderToStaticMarkup(
      <>
        <PainIssueCard issue={current} />
        <PainIssueDetailHeader issue={current} onBack={() => undefined} />
        <PainEntryList entries={entries} />
        <PainChartContent entries={entries} range={range} weeks={12} location="Đầu gối · trái" />
      </>,
    ).toLocaleLowerCase('vi-VN');
    for (const word of forbiddenWords) expect(html).not.toContain(word);
  }
});
it('ghi chú và tên thuốc là văn bản, vẫn có bối cảnh thuốc khi ít điểm', () => {
  const html = renderToStaticMarkup(
    <PainChartContent
      entries={[{ ...entries[0]!, note: '<img src=x onerror=alert(1)>' }]}
      range={range}
      weeks={4}
      location="Đầu gối · trái"
      context={{
        ...range,
        courses: [],
        asNeededDoses: [
          {
            courseId: 'c',
            name: '<script>thuốc</script>',
            givenAt: entries[0]!.recordedAt,
            quantity: 1,
            unit: 'viên',
          },
        ],
      }}
    />,
  );
  expect(html).toContain('Bối cảnh thuốc');
  expect(html).toContain('&lt;script&gt;thuốc&lt;/script&gt;');
  expect(html).toContain('&lt;img');
  expect(html).not.toContain('<script>');
});
