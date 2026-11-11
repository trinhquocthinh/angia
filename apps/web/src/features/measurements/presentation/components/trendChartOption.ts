import { chartTooltipStyle } from '@src/shared/theme/chartTooltipStyle';
import { readThemeColor } from '@src/shared/theme/readThemeColor';
import type { EChartsCoreOption } from 'echarts/core';
import type { PeriodBand } from '@src/features/adherence/application/periodBands';
import { STATUS_LABEL } from '@src/features/adherence/application/periodText';
import { formatDay } from '../../application/formatMeasurement';
import type { TrendLine, TrendPoint } from '../../application/buildTrendLines';

// Hoa văn SVG là ảnh độc lập: màu phải được chèn trước khi mã hóa data URL.
function bandStyle(status: PeriodBand['status']) {
  if (status === 'taking') return { color: readThemeColor('accent-soft') };
  const image = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="${readThemeColor('period-stopped')}"/>` +
      `<path d="M-2 2l4-4M0 8l8-8M6 10l4-4" stroke="${readThemeColor('period-hatch')}" stroke-opacity="0.28" stroke-width="1.2"/></svg>`,
  )}`;
  return { color: { image, repeat: 'repeat' as const } };
}

// Series rỗng chỉ để mang markArea; đặt đầu tiên để nằm dưới các đường số đo.
function bandSeries(bands: PeriodBand[]) {
  if (bands.length === 0) return [];
  const data = bands.map((band) => [
    {
      xAxis: `${band.from}T00:00`,
      itemStyle: bandStyle(band.status),
      label: { formatter: STATUS_LABEL[band.status] },
    },
    { xAxis: `${band.to}T23:59` },
  ]);
  return [
    {
      type: 'line',
      name: 'Giai đoạn dùng thuốc',
      data: [],
      silent: true,
      markArea: {
        silent: true,
        label: {
          show: true,
          position: 'insideTopLeft',
          color: readThemeColor('text-secondary'),
          fontSize: 11,
          fontWeight: 600,
        },
        data,
      },
    },
  ];
}

const pointTime = ([at]: TrendPoint) => {
  const [day = '', time = ''] = at.split('T');
  return time === '00:00' ? formatDay(day) : `${formatDay(day)} · ${time}`;
};
const formatValue = (value: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value);

function lineSeries(line: TrendLine) {
  const color = readThemeColor(
    { systolic: 'accent', diastolic: 'series-diastolic', glucose: 'series-glucose' }[line.key],
  );
  return [
    {
      type: 'line',
      name: line.label,
      data: line.data,
      connectNulls: false,
      symbol: line.dashed ? 'emptyCircle' : 'circle',
      symbolSize: 7,
      itemStyle: { color },
      lineStyle: { color, width: line.dashed ? 2 : 3, type: line.dashed ? 'dashed' : 'solid' },
      // Nhãn trực tiếp tại điểm cuối thay cho chú giải màu (Design §2.2).
      endLabel: { show: true, formatter: line.label, color, fontWeight: 600, fontSize: 12 },
      tooltip: {
        formatter: ({ value }: { value: TrendPoint }) =>
          `${pointTime(value)}<br/>${line.label}: <b>${formatValue(value[1])}</b> ${line.unit}`,
      },
    },
    {
      type: 'line',
      name: `${line.label} — qua tuần chưa đo`,
      data: line.bridges,
      connectNulls: false,
      symbol: 'none',
      silent: true,
      lineStyle: { color, width: 1.5, type: 'dotted', opacity: 0.55 },
    },
  ];
}

export function trendChartOption(
  lines: TrendLine[],
  range: { from: string; to: string },
  animate: boolean,
  bands: PeriodBand[] = [],
): EChartsCoreOption {
  return {
    animation: animate,
    textStyle: { fontFamily: 'Be Vietnam Pro, system-ui, sans-serif' },
    grid: { left: 8, right: 84, top: 28, bottom: 8, containLabel: true },
    tooltip: { trigger: 'item', confine: true, ...chartTooltipStyle() },
    xAxis: {
      type: 'time',
      min: `${range.from}T00:00`,
      max: `${range.to}T23:59`,
      axisLabel: { formatter: '{dd}/{MM}', color: readThemeColor('text-secondary'), hideOverlap: true },
      axisLine: { lineStyle: { color: readThemeColor('border') } },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      scale: true,
      name: lines[0]?.unit ?? '',
      nameTextStyle: { color: readThemeColor('text-secondary'), align: 'left' },
      axisLabel: { color: readThemeColor('text-secondary') },
      splitLine: { lineStyle: { color: readThemeColor('border') } },
    },
    series: [...bandSeries(bands), ...lines.flatMap(lineSeries)],
  };
}
