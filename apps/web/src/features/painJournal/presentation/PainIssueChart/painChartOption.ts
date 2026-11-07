import type { EChartsCoreOption } from 'echarts/core';
import type { PainContext } from '@angia/contracts';
import type { PainChartPoint } from '../../application/buildPainChartData';
import { formatPainEntryTime } from '../PainIssueDetail/formatPainEntryTime';
import { painMedicationSeries } from './painMedicationSeries';

const dayLabel = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  day: '2-digit',
  month: '2-digit',
});
const axisDay = (at: number) => {
  const parts = dayLabel.formatToParts(at);
  return `${parts.find((part) => part.type === 'day')?.value}/${parts.find((part) => part.type === 'month')?.value}`;
};

const painPointData = (point: PainChartPoint) => ({
  value: point.value,
  tooltip:
    point.value[1] === null
      ? ''
      : `${formatPainEntryTime(new Date(point.value[0]).toISOString()).replace(/\/\d{4}/, '')} — ${point.value[1]}/10${point.note ? `\n${point.note.slice(0, 100)}${point.note.length > 100 ? '…' : ''}` : ''}`,
});

export function painChartOption(
  points: PainChartPoint[],
  range: { from: string; to: string },
  animation: boolean,
  context?: PainContext,
): EChartsCoreOption {
  const { series, rows } = painMedicationSeries(context, range);
  const laneHeight = rows ? rows * 28 + 24 : 0;
  const timeAxis = {
    type: 'time',
    min: Date.parse(`${range.from}T00:00:00+07:00`),
    max: Date.parse(`${range.to}T23:59:59.999+07:00`),
    axisLabel: { formatter: axisDay, color: '#55615F', hideOverlap: true },
    splitLine: { show: false },
    axisLine: { lineStyle: { color: '#E4E0DA' } },
  };
  return {
    animation,
    textStyle: { fontFamily: 'Be Vietnam Pro, system-ui, sans-serif' },
    tooltip: {
      trigger: 'item',
      confine: true,
      position: 'top',
      renderMode: 'richText',
      formatter: ({ data }: { data: { tooltip?: string } }) => data.tooltip ?? '',
    },
    grid: [
      { left: 32, right: 16, top: 16, bottom: laneHeight + 32 },
      { left: 32, right: 16, bottom: 8, height: Math.max(1, rows * 28) },
    ],
    xAxis: [timeAxis, { ...timeAxis, gridIndex: 1, show: false }],
    yAxis: [
      {
        type: 'value',
        min: 1,
        max: 10,
        interval: 1,
        axisLabel: { color: '#55615F' },
        splitLine: { lineStyle: { color: '#E4E0DA' } },
      },
      { type: 'value', gridIndex: 1, min: -0.5, max: Math.max(0.5, rows - 0.5), inverse: true, show: false },
    ],
    series: [
      {
        type: 'line',
        name: 'Mức đau',
        data: points.map(painPointData),
        connectNulls: false,
        showAllSymbol: true,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: { color: '#1F2A2A' },
        lineStyle: { color: '#1F2A2A', width: 2 },
      },
      ...series,
    ],
  };
}
