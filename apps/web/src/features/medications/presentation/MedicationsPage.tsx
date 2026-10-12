import { useCurrentSession } from '@src/features/auth/application/useCurrentSession';
import { fetchCurrentSession } from '@src/features/auth/infrastructure/fetchCurrentSession';
import { ProfileHealthHeader } from '@src/features/measurements/presentation/components/ProfileHealthHeader';
import { useProfileSessionRecovery } from '@src/features/profiles/application/useProfileSessionRecovery';
import { useProfilesWorkspace } from '@src/features/profiles/application/useProfilesWorkspace';
import { createProfilesRepository } from '@src/features/profiles/infrastructure/createProfilesRepository';
import { ProfileFrame } from '@src/features/profiles/presentation/components/ProfileFrame';
import { RecipientNotice } from '@src/features/profiles/presentation/components/RecipientNotice';
import '@src/features/profiles/presentation/profiles.css';
import { useCurrentMedications } from '../application/useCurrentMedications';
import { createMedicationCatalogRepository } from '../infrastructure/createMedicationCatalogRepository';
import { MedicationCatalog } from './MedicationCatalog';
import { SelfReportedCourseAction } from './SelfReportedCourseAction';
import { StopCourseAction } from './StopCourseAction';

const profilesRepository = createProfilesRepository();
const catalogRepository = createMedicationCatalogRepository();

// Tab "Thuốc điều trị" (E4-S4-T1): danh mục thuốc đang dùng hôm nay theo buổi (SPEC-018).
export function MedicationsPage({ profileId }: { profileId: string }) {
  const session = useCurrentSession(fetchCurrentSession);
  const workspace = useProfilesWorkspace(profilesRepository, session.data);
  const profiles = workspace.profiles.data ?? [];
  const profile = profiles.find((item) => item.id === profileId);
  useProfileSessionRecovery(workspace.profiles.error);
  if (!session.data) return null;
  const main = session.data.role === 'main';
  return (
    <ProfileFrame session={session.data} profiles={main ? profiles : []} logout={workspace.logout}>
      {!main ? (
        <RecipientNotice />
      ) : workspace.profiles.isSuccess && !profile ? (
        <p role="alert" className="rounded-[20px] bg-white p-6 text-sm">
          Không tìm thấy hồ sơ này trong gia đình.
        </p>
      ) : (
        profile && <MedicationsContent profile={profile} session={session.data} />
      )}
    </ProfileFrame>
  );
}

function MedicationsContent({
  profile,
  session,
}: Pick<Parameters<typeof SelfReportedCourseAction>[0], 'profile' | 'session'>) {
  const medications = useCurrentMedications(catalogRepository, session, profile);
  return (
    <div className="flex flex-col gap-6">
      <ProfileHealthHeader
        profile={profile}
        active="medications"
        actions={
          <>
            <SelfReportedCourseAction profile={profile} session={session} />
            <StopCourseAction profile={profile} session={session} />
          </>
        }
      />
      <div className="rounded-xl bg-white px-5 py-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[#004135]">Thuốc đang dùng hôm nay</h2>
      </div>
      {profile.consentStatus !== 'confirmed' ? (
        <p role="alert" className="rounded-[20px] bg-white p-6 text-sm">
          Hồ sơ chưa được đồng ý lưu dữ liệu.
        </p>
      ) : (
        <MedicationCatalog
          data={medications.data}
          loading={medications.isPending}
          error={medications.isError}
          retry={() => void medications.refetch()}
        />
      )}
    </div>
  );
}
