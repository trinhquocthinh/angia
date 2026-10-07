import { formatDay, formatNumber } from '../../application/formatMeasurement';
import type { Measurement, MeasurementKind } from '../../application/ports';

const cell = 'px-4 py-3 text-right tabular-nums';

export function MeasurementRow({ kind, measurement }: { kind: MeasurementKind; measurement: Measurement }) {
  return (
    <tr className="border-b border-[#e4f0ef] last:border-0">
      <th scope="row" className="px-4 py-3 text-left font-medium">
        {formatDay(measurement.measuredOn)}
        {measurement.measuredTime && (
          <span className="block text-xs font-normal text-[#55615f]">{measurement.measuredTime}</span>
        )}
      </th>
      {kind === 'blood_pressure' ? (
        <>
          <td className={`${cell} font-semibold text-[#004135]`}>{measurement.systolic}</td>
          <td className={cell}>{measurement.diastolic}</td>
          <td className={cell}>{measurement.pulse ?? '—'}</td>
        </>
      ) : (
        <>
          <td className={`${cell} font-semibold text-[#004135]`}>
            {formatNumber(measurement.glucoseValue ?? 0)}
          </td>
          <td className={cell}>{measurement.glucoseUnit}</td>
        </>
      )}
      <td className={cell}>
        <span className="rounded-full bg-[#e4f0ef] px-2 py-0.5 text-xs text-[#3f4946]">
          {measurement.sourceDocumentId ? 'Ảnh' : 'Tay'}
        </span>
      </td>
    </tr>
  );
}
