import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { forbiddenWords, type VisitSummary } from '@angia/contracts';
import { hasSummaryData } from '../application/hasSummaryData';
import { SummaryPain } from './SummaryPain';

type PainIssue = VisitSummary['painIssues'][number];
const entry = (level: number, recordedAt: string): PainIssue['entries'][number] => ({
  recordedAt,
  level,
  note: `Ghi chú mức ${level}`,
  createdBy: { accountId: '0192f000-0000-7000-8000-000000000009', displayName: 'Thịnh' },
});
const issue: PainIssue = {
  region: 'knee',
  side: 'left',
  title: 'Gối sau chạy',
  status: 'resolved',
  resolvedOn: '2026-09-20',
  entries: [entry(1, '2026-08-01T01:00:00.000Z'), entry(10, '2026-08-02T17:30:00.000Z')],
  exercises: [
    {
      name: 'Duỗi gối',
      source: 'prescribed',
      prescriber: 'BS. Lan',
      startDate: '2026-08-01',
      endDate: null,
      note: 'Mỗi sáng',
    },
  ],
};
const render = (issues: PainIssue[]) => renderToStaticMarkup(<SummaryPain issues={issues} />);

describe('Mục "Đau nhức & bài tập" trên bản in (SPEC-024 v0.3)', () => {
  it('in vùng · bên, trạng thái, lần ghi giờ VN kèm người ghi và bài tập', () => {
    const html = render([issue, { ...issue, status: 'tracking', resolvedOn: null, entries: [] }]);
    expect(html).toContain('Đau nhức &amp; bài tập');
    expect(html).toContain('Đầu gối · trái');
    expect(html).toContain('Gối sau chạy');
    expect(html).toContain('Đã khỏi từ 20/09/2026');
    expect(html).toContain('Đang theo dõi');
    expect(html).toContain('03/08/2026 · 00:30');
    expect(html).toContain('Mức 10/10');
    expect(html).toContain('Ghi bởi Thịnh');
    expect(html).toContain('Duỗi gối');
    expect(html).toContain('Bác sĩ chỉ định · BS. Lan');
    expect(html).toContain('Từ 01/08/2026');
    expect(html).toContain('Không có lần ghi trong khoảng này.');
  });

  it('TC-713 (1): không có dữ liệu đau → vẫn in tiêu đề và dòng "Không có"', () => {
    const html = render([]);
    expect(html).toContain('Đau nhức &amp; bài tập');
    expect(html).toContain('Không có ghi nhận đau nhức trong khoảng này');
  });

  it('TC-713 (2): màn rỗng toàn bản chỉ khi cả năm mục rỗng', () => {
    const empty = {
      currentMedications: [],
      measurements: [],
      latestLabResults: [],
      adherencePeriods: [],
      painIssues: [],
    } as unknown as VisitSummary;
    expect(hasSummaryData(empty)).toBe(false);
    expect(hasSummaryData({ ...empty, painIssues: [issue] })).toBe(true);
  });

  it('TC-714: chỉ in con số và chữ người dùng nhập; mức 1 và 10 cùng kiểu chữ, không từ cấm SC18', () => {
    const html = render([{ ...issue, title: null, exercises: [{ ...issue.exercises[0]!, note: null }] }]);
    const text = html.replace(/<[^>]+>/g, ' ');
    for (const word of forbiddenWords) expect(text.toLowerCase()).not.toContain(word);
    const markup = (level: number) =>
      html.match(new RegExp(`<[^>]+>Mức ${level}/10`))?.[0].replace(`Mức ${level}/10`, '');
    expect(markup(1)).toBeDefined();
    expect(markup(1)).toBe(markup(10));
    expect(html).not.toMatch(/style=/);
  });
});
