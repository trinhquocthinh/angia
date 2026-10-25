import { mondayOf } from './mondayOf';
import type { MeasurementKind, SeriesPoint } from './ports';

/** [thời điểm đo 'YYYY-MM-DDTHH:mm' (chưa có giờ → 00:00), giá trị]. */
export type TrendPoint = [string, number];

export interface TrendLine {
  key: 'systolic' | 'diastolic' | 'glucose';
  label: string;
  unit: string;
  dashed: boolean;
  /** Nét chính; `null` ngắt nét tại chỗ có tuần chưa đo. */
  data: (TrendPoint | null)[];
  /** Đoạn nối mảnh qua tuần chưa đo, mỗi đoạn `[đầu, cuối, null]`. */
  bridges: (TrendPoint | null)[];
}

type LineSpec = Omit<TrendLine, 'data' | 'bridges'> & { value: (point: SeriesPoint) => number | null };

// Design §2.2: tâm thu nét liền, tâm trương nét đứt; đường huyết theo giá trị hiển thị mmol/L (BR-020).
const SPECS: Record<MeasurementKind, LineSpec[]> = {
  blood_pressure: [
    { key: 'systolic', label: 'Tâm thu', unit: 'mmHg', dashed: false, value: (point) => point.systolic },
    { key: 'diastolic', label: 'Tâm trương', unit: 'mmHg', dashed: true, value: (point) => point.diastolic },
  ],
  glucose: [
    {
      key: 'glucose',
      label: 'Đường huyết',
      unit: 'mmol/L',
      dashed: false,
      value: (point) => point.displayGlucoseValue,
    },
  ],
};

// Hai điểm liên tiếp cách nhau hơn một tuần lịch thì các tuần ở giữa không có số đo nào.
const skipsWeek = (previous: SeriesPoint, next: SeriesPoint) =>
  Date.parse(mondayOf(next.measuredOn)) - Date.parse(mondayOf(previous.measuredOn)) > 7 * 24 * 60 * 60 * 1000;

export function buildTrendLines(kind: MeasurementKind, points: SeriesPoint[]): TrendLine[] {
  return SPECS[kind].map(({ value, ...spec }) => {
    const data: (TrendPoint | null)[] = [];
    const bridges: (TrendPoint | null)[] = [];
    let previous: { point: SeriesPoint; item: TrendPoint } | null = null;
    for (const point of points) {
      const y = value(point);
      if (y === null) continue;
      const item: TrendPoint = [`${point.measuredOn}T${point.measuredTime ?? '00:00'}`, y];
      if (previous && skipsWeek(previous.point, point)) {
        data.push(null);
        bridges.push(previous.item, item, null);
      }
      data.push(item);
      previous = { point, item };
    }
    return { ...spec, data, bridges };
  });
}
