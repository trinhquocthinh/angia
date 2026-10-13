import { ProfileHealthHeader } from '@src/features/measurements/presentation/components/ProfileHealthHeader';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import { ProfileSectionPage } from '@src/features/profiles/presentation/components/ProfileSectionPage';
import { useLabSeries } from '../application/useLabSeries';
import { createLabResultsRepository } from '../infrastructure/createLabResultsRepository';
import { LabSeriesList } from './LabSeriesList';

const labResultsRepository = createLabResultsRepository();

// Tab "Kết quả xét nghiệm" (E5-S2-T1): chuỗi kết quả cận lâm sàng theo chỉ số (SPEC-021).
export function LabResultsPage({ profileId }: { profileId: string }) {
  return (
    <ProfileSectionPage profileId={profileId}>
      {(profile, session) => <LabResultsContent profile={profile} session={session} />}
    </ProfileSectionPage>
  );
}

function LabResultsContent({ profile, session }: { profile: HealthProfile; session: ProfileSession }) {
  const series = useLabSeries(labResultsRepository, session, profile);
  return (
    <div className="flex flex-col gap-6">
      <ProfileHealthHeader profile={profile} active="lab-results" />
      <div className="rounded-xl bg-white px-5 py-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[#004135]">Kết quả cận lâm sàng qua các lần khám</h2>
      </div>
      {profile.consentStatus !== 'confirmed' ? (
        <p role="alert" className="rounded-[20px] bg-white p-6 text-sm">
          Hồ sơ chưa được đồng ý lưu dữ liệu.
        </p>
      ) : (
        <LabSeriesList
          data={series.data}
          loading={series.isPending}
          error={series.isError}
          retry={() => void series.refetch()}
        />
      )}
    </div>
  );
}
