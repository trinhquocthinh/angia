import { useState } from 'react';
import { StopCourseAction } from '@src/features/medications/presentation/StopCourseAction';
import { SelfReportedCourseAction } from '@src/features/medications/presentation/SelfReportedCourseAction';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import type { MeasurementKind } from '../../application/ports';
import type { WeekSpan } from '../../application/seriesRange';
import { useMeasurementSeries } from '../../application/useMeasurementSeries';
import { useProfileMeasurements } from '../../application/useProfileMeasurements';
import { createMeasurementsRepository } from '../../infrastructure/createMeasurementsRepository';
import { ProfileHealthSections } from './ProfileHealthSections';
import { HealthTrendToolbar } from './HealthTrendToolbar';
import { ProfileHealthHeader } from './ProfileHealthHeader';

const repository = createMeasurementsRepository();

export function ProfileHealthContent({
  profile,
  session,
}: {
  profile: HealthProfile;
  session: ProfileSession;
}) {
  const [kind, setKind] = useState<MeasurementKind>('blood_pressure');
  const [weeks, setWeeks] = useState<WeekSpan>(12);
  const [medication, setMedication] = useState<string | null>(null);
  const measurements = useProfileMeasurements(repository, session, profile.id, kind, profile);
  const series = useMeasurementSeries(repository, session, profile.id, kind, weeks, profile);
  const rows = measurements.data?.pages.flatMap((page) => page.items) ?? [];
  return (
    <div className="flex flex-col gap-6">
      <ProfileHealthHeader
        session={session}
        profile={profile}
        latest={rows[0] ?? null}
        actions={
          <>
            <SelfReportedCourseAction profile={profile} session={session} />
            <StopCourseAction profile={profile} session={session} />
          </>
        }
      />
      <HealthTrendToolbar
        kind={kind}
        weeks={weeks}
        onKindChange={setKind}
        onWeeksChange={setWeeks}
        profile={profile}
        session={session}
        onMedicationSaved={setMedication}
      />
      <ProfileHealthSections
        profile={profile}
        kind={kind}
        weeks={weeks}
        series={series}
        measurements={measurements}
        medication={medication}
        onMedicationChange={setMedication}
      />
    </div>
  );
}
