import type { PainContext } from '@angia/contracts';
import { formatPainEntryTime } from '../PainIssueDetail/formatPainEntryTime';

type Point = {
  value: [number, number];
  tooltip: string;
  symbol?: 'circle' | 'rect';
  symbolSize?: number | [number, number];
  itemStyle?: { color: string };
  label?: { show: boolean; formatter: () => string; position: 'top'; fontSize: number };
};
type Series = {
  type: 'line';
  xAxisIndex: number;
  yAxisIndex: number;
  symbol: 'none';
  lineStyle: { color: string; width: number };
  data: Point[];
};

export function painMedicationSeries(context: PainContext | undefined, range: { from: string; to: string }) {
  const series: Series[] = [];
  if (!context) return { series, rows: 0 };
  const min = Date.parse(`${range.from}T00:00:00+07:00`);
  const max = Date.parse(`${range.to}T23:59:59.999+07:00`);
  const doses = context.asNeededDoses.filter(
    (dose) => Date.parse(dose.givenAt) >= min && Date.parse(dose.givenAt) <= max,
  );
  let rows = doses.length ? 1 : 0;
  const base = { type: 'line' as const, xAxisIndex: 1, yAxisIndex: 1, symbol: 'none' as const };
  for (const dose of doses) {
    const at = Date.parse(dose.givenAt);
    const tooltip = `${dose.name}\n${formatPainEntryTime(dose.givenAt)}${dose.quantity !== null ? ` · ${dose.quantity} ${dose.unit ?? ''}` : ''}`;
    series.push({
      ...base,
      lineStyle: { color: '#55615F', width: 2 },
      data: [
        { value: [at, 0], tooltip, symbol: 'rect', symbolSize: [3, 12], itemStyle: { color: '#55615F' } },
      ],
    });
  }
  for (const course of context.courses) {
    const start = Math.max(min, Date.parse(`${course.startDate}T00:00:00+07:00`));
    const end = Math.min(max, course.endDate ? Date.parse(`${course.endDate}T23:59:59.999+07:00`) : max);
    if (start > end) continue;
    const tooltip = `${course.name}\n${course.startDate.split('-').reverse().join('/')} – ${course.endDate?.split('-').reverse().join('/') ?? 'đến nay'}`;
    const row = rows++;
    series.push({
      ...base,
      lineStyle: { color: '#E4E0DA', width: 4 },
      data: [
        { value: [start, row], tooltip },
        {
          value: [(start + end) / 2, row],
          tooltip,
          symbol: 'circle',
          symbolSize: 0,
          label: {
            show: true,
            position: 'top',
            fontSize: 10,
            formatter: () => (course.name.length > 28 ? `${course.name.slice(0, 28)}…` : course.name),
          },
        },
        { value: [end, row], tooltip },
      ],
    });
  }
  return { series, rows };
}
