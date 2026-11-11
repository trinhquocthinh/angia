import { useDocumentTheme } from '@src/shared/theme/useDocumentTheme';
import ReactEChartsCore from 'echarts-for-react/esm/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { SVGRenderer } from 'echarts/renderers';
import type { PainContext } from '@angia/contracts';
import type { PainChartPoint } from '../../application/buildPainChartData';
import { painChartOption } from './painChartOption';
echarts.use([LineChart, GridComponent, TooltipComponent, SVGRenderer]);

export function PainChartCanvas({
  points,
  range,
  context,
}: {
  points: PainChartPoint[];
  range: { from: string; to: string };
  context?: PainContext | undefined;
}) {
  useDocumentTheme();
  const animate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <ReactEChartsCore
      echarts={echarts}
      option={painChartOption(points, range, animate, context)}
      notMerge
      style={{ height: '100%', width: '100%' }}
      opts={{ renderer: 'svg' }}
    />
  );
}
