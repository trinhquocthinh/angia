import type { Measurement } from '@angia/contracts';
import { formatDay, readingText } from '@src/features/measurements/application/formatMeasurement';

export interface SummaryMeasurementRow {
  /** id số đo đầu tiên của dòng. */
  key: string;
  date: string;
  time: string | null;
  bloodPressure: string | null;
  pulse: string | null;
  glucose: string | null;
}

const momentKey = (measurement: Measurement) => `${measurement.measuredOn}|${measurement.measuredTime ?? ''}`;

function fill(row: SummaryMeasurementRow, measurement: Measurement): boolean {
  if (measurement.kind === 'glucose') {
    if (row.glucose !== null) return false;
    row.glucose = readingText(measurement);
    return true;
  }
  if (row.bloodPressure !== null) return false;
  row.bloodPressure = `${measurement.systolic}/${measurement.diastolic}`;
  row.pulse = measurement.pulse === null ? null : String(measurement.pulse);
  return true;
}

// Owner chốt E6-S1-T2: số đo cùng ngày + giờ gộp một dòng (HA · Mạch · ĐH) để bản in gọn; giữ thứ tự API
// (cũ nhất trước) và đơn vị gốc đường huyết (BR-020). Hai số đo cùng loại cùng lúc thì tách dòng, không ghi đè.
export function measurementRows(measurements: readonly Measurement[]): SummaryMeasurementRow[] {
  const rows: SummaryMeasurementRow[] = [];
  const byMoment = new Map<string, SummaryMeasurementRow[]>();
  for (const measurement of measurements) {
    const key = momentKey(measurement);
    const sameMoment = byMoment.get(key) ?? [];
    if (sameMoment.some((row) => fill(row, measurement))) continue;
    const row: SummaryMeasurementRow = {
      key: measurement.id,
      date: formatDay(measurement.measuredOn),
      time: measurement.measuredTime,
      bloodPressure: null,
      pulse: null,
      glucose: null,
    };
    fill(row, measurement);
    rows.push(row);
    byMoment.set(key, [...sameMoment, row]);
  }
  return rows;
}
