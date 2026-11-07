import { LabSeriesList } from '@src/features/labResults/presentation/LabSeriesList';
import { lazy, Suspense } from 'react';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import type { SelfSectionKey } from '../application/selfSections';
import { useSelfQuery } from '../application/useSelfQuery';
import { SelfHealth } from './SelfHealth';
import { selfProfileRepository as repository } from './selfProfileRepository';
import { SelfRevisits } from './SelfRevisits';
import { SelfTimeline } from './SelfTimeline';
import { SelfToday } from './SelfToday';

const TemperatureWorkspace = lazy(() =>
  import('@src/features/temperatures/presentation/TemperatureWorkspace').then((module) => ({
    default: module.TemperatureWorkspace,
  })),
);

type Props = { session: ProfileSession; section: SelfSectionKey };

export function SelfSection({ session, section }: Props) {
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
    <LabSeriesList
      data={series.data}
      loading={series.isPending}
      error={series.isError}
      retry={() => void series.refetch()}
      readOnly
    />
  );
}
