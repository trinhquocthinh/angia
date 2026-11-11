import { lazy, Suspense } from 'react';
import type { SelfProfile } from '@angia/contracts';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import type { SelfSectionKey } from '../application/selfSections';
import { useSelfQuery } from '../application/useSelfQuery';
import { SelfHealth } from './SelfHealth';
import { selfProfileRepository as repository } from './selfProfileRepository';
import { SelfRevisits } from './SelfRevisits';
import { SelfTimeline } from './SelfTimeline';
import { SelfToday } from './SelfToday';

const LabSeriesList = lazy(() =>
  import('@src/features/labResults/presentation/LabSeriesList').then((module) => ({
    default: module.LabSeriesList,
  })),
);

const TemperatureWorkspace = lazy(() =>
  import('@src/features/temperatures/presentation/TemperatureWorkspace').then((module) => ({
    default: module.TemperatureWorkspace,
  })),
);

const SelfPainJournal = lazy(() =>
  import('./SelfPainJournal').then((module) => ({
    default: module.SelfPainJournal,
  })),
);

type Props = {
  session: ProfileSession;
  section: SelfSectionKey;
  profile: SelfProfile;
  issueId?: string | undefined;
};

export function SelfSection({ session, section, profile, issueId }: Props) {
  switch (section) {
    case 'today':
      return <SelfToday session={session} />;
    case 'revisits':
      return <SelfRevisits session={session} />;
    case 'timeline':
      return <SelfTimeline session={session} />;
    case 'health':
      return <SelfHealth session={session} />;
    case 'lab-results':
      return <SelfLabResults session={session} />;
    case 'pain':
      return (
        <Suspense fallback={<p role="status">Đang tải sổ đau nhức…</p>}>
          <SelfPainJournal session={session} profile={profile} issueId={issueId} />
        </Suspense>
      );
    case 'temperatures':
      return (
        <Suspense fallback={<p role="status">Đang tải nhiệt độ…</p>}>
          <TemperatureWorkspace
            key={session.account.healthProfileId}
            session={session}
            profileId={session.account.healthProfileId!}
            readOnly
          />
        </Suspense>
      );
  }
}

function SelfLabResults({ session }: { session: ProfileSession }) {
  const series = useSelfQuery(session, 'lab-results', (signal) => repository.labSeries(signal));
  return (
    <Suspense fallback={<p role="status">Đang tải kết quả xét nghiệm…</p>}>
      <LabSeriesList
        data={series.data}
        loading={series.isPending}
        error={series.isError}
        retry={() => void series.refetch()}
        readOnly
      />
    </Suspense>
  );
}
