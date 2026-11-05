import { LabSeriesList } from '@src/features/labResults/presentation/LabSeriesList';
import { TemperatureWorkspace } from '@src/features/temperatures/presentation/TemperatureWorkspace';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import type { SelfSectionKey } from '../application/selfSections';
import { useSelfQuery } from '../application/useSelfQuery';
import { SelfHealth } from './SelfHealth';
import { selfProfileRepository as repository } from './selfProfileRepository';
import { SelfRevisits } from './SelfRevisits';
import { SelfTimeline } from './SelfTimeline';
import { SelfToday } from './SelfToday';

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
        <TemperatureWorkspace
          key={session.account.healthProfileId}
          session={session}
          profileId={session.account.healthProfileId!}
          readOnly
        />
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
