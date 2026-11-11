import { MedicationCatalog } from '@src/features/medications/presentation/MedicationCatalog';
import { AsNeededDoseActions } from '@src/features/asNeededDoses/presentation/AsNeededDoseActions';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { useSelfQuery } from '../application/useSelfQuery';
import { selfProfileRepository as repository } from './selfProfileRepository';
import { SelfReminders } from './SelfReminders';
import { SelfRevisits } from './SelfRevisits';

const heading = 'text-xl font-semibold text-accent';

// Trang đầu (Design §9.5): thuốc theo buổi, lời nhắc của ngày, lịch hẹn sắp tới.
export function SelfToday({ session }: { session: ProfileSession }) {
  const medications = useSelfQuery(session, 'medications', (signal) => repository.medications(signal));
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className={heading}>Thuốc hôm nay</h2>
        <MedicationCatalog
          data={medications.data}
          loading={medications.isPending}
          error={medications.isError}
          retry={() => void medications.refetch()}
          readOnly
          renderCourseActions={(course) => <AsNeededDoseActions course={course} session={session} readOnly />}
        />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className={heading}>Lời nhắc hôm nay</h2>
        <SelfReminders session={session} />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className={heading}>Lịch hẹn sắp tới</h2>
        <SelfRevisits session={session} />
      </section>
    </div>
  );
}
