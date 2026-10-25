import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { groupByMedication } from '../application/medicationPeriods';
import type { AdherencePeriod } from '../application/ports';
import { AdherenceForm } from './AdherenceForm';
import { AdherenceOverlay } from './AdherenceOverlay';
import { AdherenceSheetNotice } from './AdherenceSheetNotice';

const period = (
  medicationName: string,
  status: AdherencePeriod['status'],
  fromDate: string,
  toDate: string | null,
): AdherencePeriod => ({
  id: `${medicationName}-${fromDate}`,
  healthProfileId: 'p',
  medicationName,
  status,
  fromDate,
  toDate,
});
const periods = [
  period('Amlodipin', 'taking', '2026-08-01', '2026-09-14'),
  period('Amlodipin', 'stopped', '2026-09-15', null),
  period('Metformin', 'taking', '2026-07-01', null),
];
const range = { from: '2026-09-01', to: '2026-10-11' };
const overlay = (selected: string | null) =>
  renderToStaticMarkup(
    <AdherenceOverlay periods={periods} range={range} selected={selected} onSelect={() => undefined}>
      {(bands) => <output>{bands.map((band) => `${band.status}:${band.from}→${band.to}`).join(' ')}</output>}
    </AdherenceOverlay>,
  );
const EVALUATIVE = /tăng|giảm|cao|thấp|bất thường|tốt|xấu|hiệu quả/i;

describe('TC-268 giao diện giai đoạn dùng thuốc (SPEC-023, BR-033)', () => {
  it('mặc định tô nền thuốc có mốc mới nhất; chip đánh dấu aria-pressed; danh sách chỉ ngày + trạng thái', () => {
    const html = overlay(null);
    expect(html).toMatch(/aria-pressed="true"[^>]*>Amlodipin<\/button>/);
    expect(html).toMatch(/aria-pressed="false"[^>]*>Metformin<\/button>/);
    expect(html).toContain('<output>taking:2026-09-01→2026-09-14 stopped:2026-09-15→2026-10-11</output>');
    expect(html).toContain('Đang dùng 01/08/2026 – 14/09/2026');
    expect(html).toContain('Ngưng từ 15/09/2026 đến nay');
    expect(html).not.toMatch(EVALUATIVE);
  });

  it('chọn thuốc khác → nền theo thuốc đó; không có giai đoạn → chỉ biểu đồ, không chip', () => {
    expect(overlay('metformin')).toContain('<output>taking:2026-09-01→2026-10-11</output>');
    const empty = renderToStaticMarkup(
      <AdherenceOverlay periods={[]} range={range} selected={null} onSelect={() => undefined}>
        {(bands) => <output>{bands.length}</output>}
      </AdherenceOverlay>,
    );
    expect(empty).toBe('<output>0</output>');
  });

  it('form: trạng thái gần nhất từng thuốc, gợi ý tên, ngày tối đa hôm nay', () => {
    const html = renderToStaticMarkup(
      <AdherenceForm
        today="2026-10-13"
        groups={groupByMedication(periods)}
        suggestions={['Amlodipin', 'Canxi', 'Metformin']}
        pending={false}
        error={null}
        onSubmit={() => undefined}
        onCancel={() => undefined}
      />,
    );
    expect(html).toContain('Ngưng từ 15/09/2026');
    expect(html).toContain('Đang dùng từ 01/07/2026');
    expect(html).toContain('<option value="Canxi"></option>');
    expect(html).toContain('max="2026-10-13"');
    expect(html).toContain('Lưu giai đoạn');
    expect(html).not.toMatch(EVALUATIVE);
  });

  it('chưa đồng thuận / đã lưu: thông báo trung lập', () => {
    const list = { isPending: false, isError: false, refetch: async () => ({}) as never };
    expect(
      renderToStaticMarkup(<AdherenceSheetNotice consented={false} list={list} saved={null} />),
    ).toContain('Hồ sơ chưa được đồng ý lưu dữ liệu.');
    expect(
      renderToStaticMarkup(<AdherenceSheetNotice consented={true} list={list} saved={periods[1]!} />),
    ).toContain('Đã ghi nhận Amlodipin · Ngưng từ 15/09/2026.');
  });
});
