import { expect, it } from 'vitest';
import { painChartOption } from './painChartOption';
import { painMedicationSeries } from './painMedicationSeries';
const range = { from: '2026-11-01', to: '2026-11-30' };
const context = {
  ...range,
  asNeededDoses: [
    { courseId: 'c', name: 'Thuốc A', givenAt: '2026-11-04T03:00:00Z', quantity: 1, unit: 'viên' },
  ],
  courses: [
    { courseId: 'c', name: 'Thuốc A', startDate: '2026-10-01', endDate: null, status: 'active' as const },
  ],
};
it('TC-724 — làn thuốc cùng miền thời gian, cắt đợt giao khoảng, tách trục mức đau', () => {
  const lanes = painMedicationSeries(context, range);
  expect(lanes.series).toHaveLength(2);
  expect(lanes.series.every((series) => series.xAxisIndex === 1 && series.yAxisIndex === 1)).toBe(true);
  const dose = lanes.series[0]!;
  expect(dose.data.map((point) => point.value[0])).toEqual([Date.parse('2026-11-04T03:00:00Z')]);
  const course = lanes.series[1]!;
  expect(course.data[0]!.value).toEqual([Date.parse('2026-11-01T00:00:00+07:00'), 1]);
  expect(course.data.at(-1)!.value).toEqual([Date.parse('2026-11-30T23:59:59.999+07:00'), 1]);
  const option = painChartOption([], range, false, context);
  expect(option.xAxis).toMatchObject([
    { min: Date.parse('2026-11-01T00:00:00+07:00') },
    { min: Date.parse('2026-11-01T00:00:00+07:00') },
  ]);
  expect(option.yAxis).toMatchObject([{ min: 1, max: 10, interval: 1 }, { show: false }]);
  expect(option.animation).toBe(false);
  const axes = option.xAxis as { axisLabel: { formatter: (at: number) => string } }[];
  expect(axes[0]!.axisLabel.formatter(Date.parse('2026-10-31T17:00:00Z'))).toBe('01/11');
});
it('TC-725 — điểm và nét có cùng kiểu ở mức 1 và 10, không tô vùng hoặc nối khoảng trống', () => {
  const options = [1, 10].map((level) => painChartOption([{ value: [0, level], note: null }], range, false));
  for (const option of options)
    expect(option.series).toMatchObject([
      {
        connectNulls: false,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: { color: '#1F2A2A' },
        lineStyle: { color: '#1F2A2A', width: 2 },
      },
    ]);
  expect(painMedicationSeries(undefined, range)).toEqual({ series: [], rows: 0 });
});
