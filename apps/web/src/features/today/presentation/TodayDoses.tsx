import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { Button } from '@src/shared/ui/button/Button';
import type { TodayTarget } from '../application/ports';
import { useTodayReminders } from '../application/useTodayReminders';
import { createTodayRepository } from '../infrastructure/createTodayRepository';
import { DoseSlotCard } from './DoseSlotCard';
import { TodayNotice } from './TodayNotice';

const repository = createTodayRepository();

export function TodayDoses({ session, target }: { session: ProfileSession; target: TodayTarget }) {
  const query = useTodayReminders(repository, session, target);
  const main = session.role === 'main';
  if (
    target.profile.consentStatus !== 'confirmed' ||
    (query.error instanceof MedicationRequestError && query.error.code === 'ERR_CONSENT_REQUIRED')
  )
    return (
      <TodayNotice
        kind={target.profile.consentStatus === 'withdrawn' ? 'withdrawn' : 'consent'}
        main={main}
      />
    );
  if (!query.enabled) return null;
  if (query.isError)
    return (
      <div role="alert" className="flex flex-col items-start gap-4">
        <p>Không thể tải liều hôm nay.</p>
        <Button variant="secondary" disabled={query.isFetching} onClick={() => void query.refetch()}>
          Thử lại
        </Button>
      </div>
    );
  if (!query.data) return <p role="status">Đang tải liều hôm nay…</p>;
  if (!query.data.length) return <TodayNotice kind="empty" main={main} profileId={target.profile.id} />;
  return (
    <ul className="grid gap-4">
      {query.data.map((reminder) => (
        <li key={reminder.id}>
          <DoseSlotCard key={reminder.id} reminder={reminder} session={session} />
        </li>
      ))}
    </ul>
  );
}
