import { ProfileHealthHeader } from '@src/features/measurements/presentation/components/ProfileHealthHeader';
import { ProfileSectionPage } from '@src/features/profiles/presentation/components/ProfileSectionPage';
import { DoseSlotsLink } from '@src/features/reminders/presentation/DoseSlotsLink';
import { useCurrentMedications } from '../application/useCurrentMedications';
import { createMedicationCatalogRepository } from '../infrastructure/createMedicationCatalogRepository';
import { MedicationCatalog } from './MedicationCatalog';
import { SelfReportedCourseAction } from './SelfReportedCourseAction';
import { StopCourseAction } from './StopCourseAction';

const catalogRepository = createMedicationCatalogRepository();

// Tab "Thuốc điều trị" (E4-S4-T1): danh mục thuốc đang dùng hôm nay theo buổi (SPEC-018).
export function MedicationsPage({ profileId }: { profileId: string }) {
  return (
    <ProfileSectionPage profileId={profileId}>
      {(profile, session) => <MedicationsContent profile={profile} session={session} />}
    </ProfileSectionPage>
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
            <DoseSlotsLink profileId={profile.id} />
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
