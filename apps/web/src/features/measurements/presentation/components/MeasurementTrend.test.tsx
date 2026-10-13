import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { buildTrendLines } from '../../application/buildTrendLines';
import type { MeasurementSeries, SeriesPoint } from '../../application/ports';
import { MeasurementTrend } from './MeasurementTrend';
import { trendChartOption } from './trendChartOption';

const range = { from: '2026-09-14', to: '2026-10-11' };
const point = (day: string, systolic: number): SeriesPoint => ({
  id: day,
  healthProfileId: 'p',
  sourceDocumentId: null,
  kind: 'blood_pressure',
  measuredOn: day,
  measuredTime: '07:15',
  systolic,
  diastolic: 90,
  pulse: 72,
  glucoseValue: null,
  glucoseUnit: null,
  manualWithoutSource: true,
  createdAt: `${day}T00:00:00Z`,
  displayGlucoseValue: null,
  displayGlucoseUnit: null,
});
// Các ca dưới đây chỉ có số đo ở tuần đầu và tuần cuối của khoảng.
const seriesOf = (points: SeriesPoint[]): MeasurementSeries => ({
  points,
  periods: [],
  weeks: ['2026-09-14', '2026-09-21', '2026-09-28', '2026-10-05'].map((weekStart, index) => ({
    weekStart,
    hasMeasurement: points.length > 0 && (index === 0 || index === 3),
  })),
});
const render = (points: SeriesPoint[]) =>
  renderToStaticMarkup(
    <MeasurementTrend kind="blood_pressure" weeks={4} range={range} series={seriesOf(points)} bands={[]} />,
  );

describe('TC-255 biểu đồ diễn biến: thẻ thống kê khi thưa, bảng ẩn khi vẽ đồ thị', () => {
  it('không có số đo trong khoảng: câu nhắc tự nhiên', () => {
    expect(render([])).toContain('Chưa có số đo trong 4 tuần gần đây.');
  });

  it('dưới 4 điểm: thẻ thống kê mới nhất trước, không dựng biểu đồ', () => {
    const html = render([point('2026-09-15', 140), point('2026-10-06', 152)]);
    expect(html).toContain('Cần ít nhất 4 lần đo trong 4 tuần để vẽ biểu đồ.');
    expect(html.indexOf('152/90')).toBeLessThan(html.indexOf('140/90'));
    expect(html).toContain('06/10/2026 · 07:15');
    expect(html).not.toContain('Đang tải biểu đồ');
  });

  it('đủ 4 điểm: vùng biểu đồ aria-hidden + bảng ẩn có câu mô tả trung lập', () => {
    const html = render([
      point('2026-09-15', 140),
      point('2026-09-16', 142),
      point('2026-10-06', 150),
      point('2026-10-07', 152),
    ]);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('<div class="sr-only"><table><caption>');
    expect(html).toContain('Huyết áp từ 14/09/2026 đến 11/10/2026: 4 lần đo, 2 tuần chưa đo.');
    expect(html).toContain('<td>152/90 mmHg</td>');
    expect(html).toContain('Nét chấm mảnh: đoạn nối qua tuần chưa đo.');
    expect(html).not.toMatch(/tăng|giảm|cao|thấp|bất thường/i);
  });
});

describe('Cấu hình ECharts theo Design §2.2', () => {
  it('tâm thu nét liền, tâm trương nét đứt, nhãn trực tiếp cuối đường; cầu nối chấm mảnh, không tooltip', () => {
    const lines = buildTrendLines('blood_pressure', [point('2026-09-15', 140), point('2026-10-06', 150)]);
    const option = trendChartOption(lines, range, false) as {
      animation: boolean;
      xAxis: { min: string; max: string };
      series: {
        name: string;
        silent?: boolean;
        lineStyle: { type: string };
        endLabel?: { formatter: string };
      }[];
    };
    expect(option.animation).toBe(false);
    expect(option.xAxis).toMatchObject({ min: '2026-09-14T00:00', max: '2026-10-11T23:59' });
    expect(
      option.series.map((item) => [item.name, item.lineStyle.type, item.endLabel?.formatter ?? null]),
    ).toEqual([
      ['Tâm thu', 'solid', 'Tâm thu'],
      ['Tâm thu — qua tuần chưa đo', 'dotted', null],
      ['Tâm trương', 'dashed', 'Tâm trương'],
      ['Tâm trương — qua tuần chưa đo', 'dotted', null],
    ]);
    expect(option.series[1]!.silent).toBe(true);
  });
});

describe('TC-265 markArea giai đoạn dùng thuốc (SPEC-023, BR-033, Design §4.1)', () => {
  type MarkAreaItem = [
    {
      xAxis: string;
      itemStyle: { color: string | { image: string; repeat: string } };
      label: { formatter: string };
    },
    { xAxis: string },
  ];
  const bandSeries = (bands: Parameters<typeof trendChartOption>[3]) => {
    const lines = buildTrendLines('blood_pressure', [point('2026-09-15', 140), point('2026-10-06', 150)]);
    const option = trendChartOption(lines, range, false, bands) as {
      series: { name: string; silent?: boolean; markArea?: { silent: boolean; data: MarkAreaItem[] } }[];
    };
    return option.series.filter((item) => item.markArea);
  };

  it('đang dùng nền xanh nhạt, ngưng nền trung tính + hoa văn sọc, nhãn chỉ là trạng thái', () => {
    const [series] = bandSeries([
      { status: 'taking', from: '2026-09-14', to: '2026-09-20' },
      { status: 'stopped', from: '2026-09-21', to: '2026-10-11' },
    ]);
    const data = series!.markArea!.data;
    expect(data.map(([start, end]) => [start.xAxis, end.xAxis, start.label.formatter])).toEqual([
      ['2026-09-14T00:00', '2026-09-20T23:59', 'Đang dùng'],
      ['2026-09-21T00:00', '2026-10-11T23:59', 'Ngưng'],
    ]);
    expect(data[0]![0].itemStyle).toEqual({ color: '#E3EFEA' });
    // Hoa văn sọc chéo nền #F1ECE4 dựng bằng pattern ảnh SVG (decal không áp cho markArea).
    expect(data[1]![0].itemStyle.color).toEqual({
      image: expect.stringContaining('F1ECE4'),
      repeat: 'repeat',
    });
    expect(JSON.stringify(data)).not.toMatch(/tăng|giảm|cao|thấp|bất thường|tốt|xấu|#B42318/i);
  });

  it('không có giai đoạn → không thêm series nền', () => {
    expect(bandSeries([])).toEqual([]);
  });
});
