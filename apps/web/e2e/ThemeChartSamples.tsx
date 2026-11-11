import { MeasurementTrendChart } from '../src/features/measurements/presentation/components/MeasurementTrendChart';
import { PainChartCanvas } from '../src/features/painJournal/presentation/PainIssueChart/PainChartCanvas';
import { BodyMapDrawing } from '../src/features/painJournal/presentation/BodyMap2D/BodyMapDrawing';

const range = { from: '2026-11-01', to: '2026-11-30' };
const points: [string, number][] = [
  ['2026-11-01T12:00', 120],
  ['2026-11-02T12:00', 122],
];

export function ThemeChartSamples() {
  return (
    <>
      <div data-testid="trend" className="h-64">
        <MeasurementTrendChart
          range={range}
          bands={[{ ...range, status: 'stopped' }]}
          lines={(['systolic', 'diastolic', 'glucose'] as const).map((key) => ({
            key,
            label: key,
            unit: '',
            dashed: false,
            data: points,
            bridges: [],
          }))}
        />
      </div>
      <div data-testid="pain-chart" className="h-64">
        <PainChartCanvas
          range={range}
          points={[
            { value: [Date.parse('2026-11-01'), 1], note: null },
            { value: [Date.parse('2026-11-02'), 10], note: null },
          ]}
        />
      </div>
      <div data-testid="body-map" className="relative h-64">
        <BodyMapDrawing
          selected={null}
          regions={[{ region: 'knee', side: 'left', path: 'M0 0h10v10Z', mirrored: false, label: 'Gối' }]}
        />
      </div>
    </>
  );
}
