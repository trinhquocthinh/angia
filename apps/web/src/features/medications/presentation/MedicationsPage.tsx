import { ProfileDayReminders } from '@src/features/doseConfirmations/presentation/ProfileDayReminders';
import { AsNeededDoseActions } from '@src/features/asNeededDoses/presentation/AsNeededDoseActions';
import { ProfileHealthHeader } from '@src/features/measurements/presentation/components/ProfileHealthHeader';
import { PrescriptionChainLink } from '@src/features/prescriptions/presentation/PrescriptionChainLink';
import type { ProfileListItem, ProfileSession } from '@src/features/profiles/application/ports';
import { ProfileSectionIcon } from '@src/features/profiles/presentation/components/ProfileSectionIcon';
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

function MedicationsContent({ profile, session }: { profile: ProfileListItem; session: ProfileSession }) {
  const medications = useCurrentMedications(catalogRepository, session, profile);
  const count = medications.data?.courses.length;
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <ProfileHealthHeader
        session={session}
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
      <section className="profile-bento-card flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent-soft">
            <ProfileSectionIcon name="medication" size={38} />
          </span>
          <div className="min-w-0">
            <h2 className="auth-heading text-heading-2 font-semibold text-accent">Thuốc đang dùng hôm nay</h2>
            <p className="mt-0.5 text-caption text-text-secondary">
              {count === undefined
                ? 'Danh mục thuốc hiện có hiệu lực theo từng buổi trong ngày.'
                : `${count} đợt thuốc đang có hiệu lực theo buổi trong ngày.`}
            </p>
          </div>
        </div>
        {profile.consentStatus === 'confirmed' && <PrescriptionChainLink profileId={profile.id} />}
      </section>
      {profile.consentStatus !== 'confirmed' ? (
        <p role="alert" className="profile-bento-card p-6 text-body">
          Hồ sơ chưa được đồng ý lưu dữ liệu.
        </p>
      ) : (
        <>
          <MedicationCatalog
            data={medications.data}
            loading={medications.isPending}
            error={medications.isError}
            retry={() => void medications.refetch()}
            renderCourseActions={(course) => <AsNeededDoseActions course={course} session={session} />}
          />
          <ProfileDayReminders profile={profile} session={session} />
        </>
      )}
    </div>
  );
}
