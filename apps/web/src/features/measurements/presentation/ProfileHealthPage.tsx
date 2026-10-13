import { StopCourseAction } from '@src/features/medications/presentation/StopCourseAction';
import { SelfReportedCourseAction } from '@src/features/medications/presentation/SelfReportedCourseAction';
import { useState } from 'react';
import { useCurrentSession } from '@src/features/auth/application/useCurrentSession';
import { fetchCurrentSession } from '@src/features/auth/infrastructure/fetchCurrentSession';
import { useProfileSessionRecovery } from '@src/features/profiles/application/useProfileSessionRecovery';
import { useProfilesWorkspace } from '@src/features/profiles/application/useProfilesWorkspace';
import { createProfilesRepository } from '@src/features/profiles/infrastructure/createProfilesRepository';
import { ProfileFrame } from '@src/features/profiles/presentation/components/ProfileFrame';
import { RecipientNotice } from '@src/features/profiles/presentation/components/RecipientNotice';
import '@src/features/profiles/presentation/profiles.css';
import type { MeasurementKind } from '../application/ports';
import type { WeekSpan } from '../application/seriesRange';
import { useMeasurementSeries } from '../application/useMeasurementSeries';
import { useProfileMeasurements } from '../application/useProfileMeasurements';
import { createMeasurementsRepository } from '../infrastructure/createMeasurementsRepository';
import { MeasurementTableSection } from './components/MeasurementTableSection';
import { MeasurementTrendSection } from './components/MeasurementTrendSection';
import { HealthTrendToolbar } from './components/HealthTrendToolbar';
import { ProfileHealthHeader } from './components/ProfileHealthHeader';

const profilesRepository = createProfilesRepository();
const measurementsRepository = createMeasurementsRepository();
// Tab "Diễn biến sức khỏe": biểu đồ N tuần (E5-S1-T2) + nền giai đoạn thuốc (E5-S3-T2) và bảng số đo đã duyệt (E2-S6-T1).
export function ProfileHealthPage({ profileId }: { profileId: string }) {
  const session = useCurrentSession(fetchCurrentSession);
  const workspace = useProfilesWorkspace(profilesRepository, session.data);
  const [kind, setKind] = useState<MeasurementKind>('blood_pressure');
  const [weeks, setWeeks] = useState<WeekSpan>(12);
  const [medication, setMedication] = useState<string | null>(null);
  const measurements = useProfileMeasurements(measurementsRepository, session.data, profileId, kind);
  const series = useMeasurementSeries(measurementsRepository, session.data, profileId, kind, weeks);
  useProfileSessionRecovery(workspace.profiles.error);
  if (!session.data) return null;
  const main = session.data.role === 'main';
  const profiles = workspace.profiles.data ?? [];
  const profile = profiles.find((item) => item.id === profileId);
  const rows = measurements.data?.pages.flatMap((page) => page.items) ?? [];
  return (
    <ProfileFrame session={session.data} profiles={main ? profiles : []} logout={workspace.logout}>
      {!main ? (
        <RecipientNotice />
      ) : workspace.profiles.isSuccess && !profile ? (
        <p role="alert" className="rounded-[20px] bg-white p-6 text-sm">
          Không tìm thấy hồ sơ này trong gia đình.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {profile && (
            <ProfileHealthHeader
              profile={profile}
              latest={rows[0] ?? null}
              actions={
                <>
                  <SelfReportedCourseAction profile={profile} session={session.data} />
                  <StopCourseAction profile={profile} session={session.data} />
                </>
              }
            />
          )}
          <HealthTrendToolbar
            kind={kind}
            weeks={weeks}
            onKindChange={setKind}
            onWeeksChange={setWeeks}
            profile={profile}
            session={session.data}
            onMedicationSaved={setMedication}
          />
          <MeasurementTrendSection
            kind={kind}
            weeks={weeks}
            series={series}
            medication={medication}
            onMedicationChange={setMedication}
          />
          <MeasurementTableSection kind={kind} measurements={measurements} />
        </div>
      )}
    </ProfileFrame>
  );
}
