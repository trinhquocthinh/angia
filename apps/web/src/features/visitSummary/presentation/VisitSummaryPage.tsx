import { useState } from 'react';
import type { VisitSummary } from '@angia/contracts';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import { ProfileSectionPage } from '@src/features/profiles/presentation/components/ProfileSectionPage';
import { summaryRange, type SummaryMonths } from '../application/summaryRange';
import { useVisitSummary } from '../application/useVisitSummary';
import { vietnamDate } from '../application/vietnamDate';
import { createVisitSummaryRepository } from '../infrastructure/createVisitSummaryRepository';
import { SummaryPreview } from './SummaryPreview';
import { SummaryStates } from './SummaryStates';
import { SummaryToolbar } from './SummaryToolbar';
import './visit-summary.css';

const visitSummaryRepository = createVisitSummaryRepository();

const hasData = (summary: VisitSummary) =>
  summary.currentMedications.length +
    summary.measurements.length +
    summary.latestLabResults.length +
    summary.adherencePeriods.length >
  0;

// Màn "Tóm tắt tái khám" /profiles/:id/summary (E6-S1-T2, SPEC-024): xem trước A4 và in / lưu PDF.
export function VisitSummaryPage({ profileId }: { profileId: string }) {
  return (
    <ProfileSectionPage profileId={profileId}>
      {(profile, session) => <VisitSummaryContent profile={profile} session={session} />}
    </ProfileSectionPage>
  );
}

function VisitSummaryContent({ profile, session }: { profile: HealthProfile; session: ProfileSession }) {
  const [months, setMonths] = useState<SummaryMonths>(3);
  const range = summaryRange(months, vietnamDate());
  const summary = useVisitSummary(visitSummaryRepository, session, profile, range);
  const ready = summary.data !== undefined && hasData(summary.data);
  return (
    <div className="flex flex-col gap-6">
      <SummaryToolbar
        profileId={profile.id}
        displayName={profile.displayName}
        range={range}
        months={months}
        onMonthsChange={setMonths}
        canPrint={ready && !summary.isFetching}
      />
      {profile.consentStatus !== 'confirmed' ? (
        <p role="alert" className="rounded-[20px] bg-white p-6 text-sm">
          Hồ sơ chưa được đồng ý lưu dữ liệu.
        </p>
      ) : ready ? (
        <SummaryPreview summary={summary.data!} />
      ) : (
        <SummaryStates
          loading={summary.isPending}
          error={summary.isError}
          retry={() => void summary.refetch()}
        />
      )}
    </div>
  );
}
