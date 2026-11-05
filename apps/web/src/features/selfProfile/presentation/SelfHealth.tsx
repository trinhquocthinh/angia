import { useState } from 'react';
import type { MeasurementKind } from '@src/features/measurements/application/ports';
import { seriesRange, type WeekSpan } from '@src/features/measurements/application/seriesRange';
import { HealthTrendToolbar } from '@src/features/measurements/presentation/components/HealthTrendToolbar';
import { MeasurementTrendSection } from '@src/features/measurements/presentation/components/MeasurementTrendSection';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { useSelfQuery } from '../application/useSelfQuery';
import { selfProfileRepository as repository } from './selfProfileRepository';

// Chỉ dựng khi showsVitals (BR-049). profile undefined để thanh công cụ không có nút ghi giai đoạn dùng thuốc.
export function SelfHealth({ session }: { session: ProfileSession }) {
  const [kind, setKind] = useState<MeasurementKind>('blood_pressure');
  const [weeks, setWeeks] = useState<WeekSpan>(12);
  const [medication, setMedication] = useState<string | null>(null);
  const range = seriesRange(weeks);
  const query = useSelfQuery(session, `measurements:${kind}:${range.from}:${range.to}`, (signal) =>
    repository.measurementSeries(kind, range, signal),
  );
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <HealthTrendToolbar
        kind={kind}
        weeks={weeks}
        onKindChange={setKind}
        onWeeksChange={setWeeks}
        profile={undefined}
        session={session}
        onMedicationSaved={setMedication}
      />
      <MeasurementTrendSection
        kind={kind}
        weeks={weeks}
        series={{ range, query }}
        medication={medication}
        onMedicationChange={setMedication}
      />
    </div>
  );
}
