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
import { useProfileMeasurements } from '../application/useProfileMeasurements';
import { createMeasurementsRepository } from '../infrastructure/createMeasurementsRepository';
import { MeasurementKindToggle } from './components/MeasurementKindToggle';
import { MeasurementTableSection } from './components/MeasurementTableSection';
import { ProfileHealthHeader } from './components/ProfileHealthHeader';

const profilesRepository = createProfilesRepository();
const measurementsRepository = createMeasurementsRepository();

// Tab "Diễn biến sức khỏe" tối giản cho E2-S6-T1: bảng số đo đã duyệt; đồ thị, thẻ thống kê, lọc tuần thuộc E5.
export function ProfileHealthPage({ profileId }: { profileId: string }) {
  const session = useCurrentSession(fetchCurrentSession);
  const workspace = useProfilesWorkspace(profilesRepository, session.data);
  const [kind, setKind] = useState<MeasurementKind>('blood_pressure');
  const measurements = useProfileMeasurements(measurementsRepository, session.data, profileId, kind);
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
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-sm sm:p-4">
            <MeasurementKindToggle kind={kind} onChange={setKind} />
          </div>
          <MeasurementTableSection kind={kind} measurements={measurements} />
        </div>
      )}
    </ProfileFrame>
  );
}
