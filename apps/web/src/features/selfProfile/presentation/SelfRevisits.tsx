import type { ProfileSession } from '@src/features/profiles/application/ports';
import { RevisitList } from '@src/features/revisits/presentation/RevisitList';
import { useSelfQuery } from '../application/useSelfQuery';
import { SelfLoadError, SelfSkeleton } from './SelfLoadState';
import { selfProfileRepository as repository } from './selfProfileRepository';

export function SelfRevisits({ session }: { session: ProfileSession }) {
  const revisits = useSelfQuery(session, 'revisits', (signal) => repository.revisits(signal));
  if (revisits.isError) return <SelfLoadError label="lịch hẹn" retry={() => void revisits.refetch()} />;
  if (!revisits.data) return <SelfSkeleton label="lịch hẹn" />;
  return <RevisitList data={revisits.data} />;
}
