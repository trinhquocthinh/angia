import { ProfileHealthHeader } from '@src/features/measurements/presentation/components/ProfileHealthHeader';
import type { ProfileListItem, ProfileSession } from '@src/features/profiles/application/ports';
import { ProfileSectionIcon } from '@src/features/profiles/presentation/components/ProfileSectionIcon';
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

function LabResultsContent({ profile, session }: { profile: ProfileListItem; session: ProfileSession }) {
  const series = useLabSeries(labResultsRepository, session, profile);
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <ProfileHealthHeader session={session} profile={profile} active="lab-results" />
      <section className="profile-bento-card flex items-center gap-3.5 p-5 sm:p-6">
        <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent-soft">
          <ProfileSectionIcon name="science" size={38} />
        </span>
        <div className="min-w-0">
          <h2 className="auth-heading text-heading-2 font-semibold text-accent">
            Lịch sử kết quả xét nghiệm qua các lần khám
          </h2>
          <p className="mt-0.5 text-caption text-text-secondary">
            Giá trị và khoảng tham chiếu ghi theo đúng phiếu xét nghiệm.
          </p>
        </div>
      </section>
      {profile.consentStatus !== 'confirmed' ? (
        <p role="alert" className="profile-bento-card p-6 text-body">
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
