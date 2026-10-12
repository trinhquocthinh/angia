import ReactEChartsCore from 'echarts-for-react/esm/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { SVGRenderer } from 'echarts/renderers';
import type { TrendLine } from '../../application/buildTrendLines';
import { trendChartOption } from './trendChartOption';

// Import theo mô-đun (tree-shaking, Tech spec §2): chỉ Line + Grid + Tooltip + SVG renderer.
echarts.use([LineChart, GridComponent, TooltipComponent, SVGRenderer]);

type Props = { lines: TrendLine[]; range: { from: string; to: string } };

// Tệp này được nạp lười (React.lazy) nên ECharts nằm ở chunk riêng, chỉ tải khi đủ ≥ 4 điểm.
export function MeasurementTrendChart({ lines, range }: Props) {
  const animate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <ReactEChartsCore
      echarts={echarts}
      option={trendChartOption(lines, range, animate)}
      notMerge
      style={{ height: '100%', width: '100%' }}
      opts={{ renderer: 'svg' }}
    />
  );
}
