import { MedicationCatalog } from '@src/features/medications/presentation/MedicationCatalog';
import { AsNeededDoseActions } from '@src/features/asNeededDoses/presentation/AsNeededDoseActions';
import { ProfileSectionIcon } from '@src/features/profiles/presentation/components/ProfileSectionIcon';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { useSelfQuery } from '../application/useSelfQuery';
import { selfProfileRepository as repository } from './selfProfileRepository';
import { SelfReminders } from './SelfReminders';
import { SelfRevisits } from './SelfRevisits';

const headingRow = 'flex items-center gap-2.5 px-1';
const headingText = 'auth-heading text-heading-2 font-semibold text-accent';

// Trang đầu Hồ sơ của tôi (Stitch 8bafc41f / 1c851b03): lời nhắc xác nhận theo buổi, danh mục thuốc, lịch hẹn.
export function SelfToday({ session }: { session: ProfileSession }) {
  const medications = useSelfQuery(session, 'medications', (signal) => repository.medications(signal));
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <section className="flex flex-col gap-3">
        <div className={headingRow}>
          <ProfileSectionIcon name="notifications" size={28} />
          <h2 className={headingText}>Lời nhắc hôm nay</h2>
        </div>
        <SelfReminders session={session} />
      </section>
      <section className="flex flex-col gap-3">
        <div className={headingRow}>
          <ProfileSectionIcon name="medication" size={28} />
          <h2 className={headingText}>Thuốc hôm nay</h2>
        </div>
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
        <div className={headingRow}>
          <ProfileSectionIcon name="event" size={28} />
          <h2 className={headingText}>Lịch hẹn sắp tới</h2>
        </div>
        <SelfRevisits session={session} />
      </section>
    </div>
  );
}
