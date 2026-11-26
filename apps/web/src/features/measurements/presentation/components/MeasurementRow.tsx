import { formatDay, formatNumber } from '../../application/formatMeasurement';
import type { Measurement, MeasurementKind } from '../../application/ports';

const cell = 'px-4 py-3 text-right tabular-nums';

export function MeasurementRow({ kind, measurement }: { kind: MeasurementKind; measurement: Measurement }) {
  return (
    <tr className="border-b border-border/30 last:border-0">
      <th scope="row" className="px-4 py-3.5 text-left font-medium tabular-nums">
        {formatDay(measurement.measuredOn)}
        {measurement.measuredTime && (
          <span className="block text-caption font-normal text-text-secondary">
            {measurement.measuredTime}
          </span>
        )}
      </th>
      {kind === 'blood_pressure' ? (
        <>
          <td className={`${cell} font-semibold text-text-primary`}>{measurement.systolic}</td>
          <td className={cell}>{measurement.diastolic}</td>
          <td className={cell}>{measurement.pulse ?? '—'}</td>
        </>
      ) : (
        <>
          <td className={`${cell} font-semibold text-text-primary`}>
            {formatNumber(measurement.glucoseValue ?? 0)}
          </td>
          <td className={cell}>{measurement.glucoseUnit}</td>
        </>
      )}
      <td className={cell}>
        <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-caption font-medium text-text-secondary">
          {measurement.sourceDocumentId ? 'Ảnh' : 'Tay'}
        </span>
      </td>
    </tr>
  );
}
