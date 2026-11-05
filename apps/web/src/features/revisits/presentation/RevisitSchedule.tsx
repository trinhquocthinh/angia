import { useState } from 'react';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import type { RevisitPrescription } from '../application/ports';
import { useRevisits } from '../application/useRevisits';
import { createRevisitRepository } from '../infrastructure/createRevisitRepository';
import { EditRevisitDateDialog } from './EditRevisitDateDialog';
import { RevisitList } from './RevisitList';

const repository = createRevisitRepository();
type Selection = { prescription: RevisitPrescription; revisitDate: string };
export function RevisitSchedule({ profile, session }: { profile: HealthProfile; session: ProfileSession }) {
  const revisits = useRevisits(repository, session, profile);
  const [selected, setSelected] = useState<Selection | null>(null);
  const close = () => {
    const id = selected?.prescription.id;
    setSelected(null);
    // Tải lại danh sách có thể thay nút đã mở dialog; trả focus về nút hiện hành.
    requestAnimationFrame(() => document.getElementById(`revisit-edit-${id}`)?.focus());
  };
  if (profile.consentStatus !== 'confirmed')
    return (
      <p role="alert" className="rounded-[20px] bg-white p-6 text-sm">
        Hồ sơ chưa được đồng ý lưu dữ liệu.
      </p>
    );
  return (
    <>
      {revisits.isError ? (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-[20px] bg-white p-6 text-sm">
          <p>Không thể tải lịch tái khám. Vui lòng thử lại.</p>
          <button
            type="button"
            onClick={() => void revisits.refetch()}
            className="min-h-11 rounded-full bg-[#004135] px-5 font-semibold text-white"
          >
            Thử lại
          </button>
        </div>
      ) : revisits.data ? (
        <RevisitList
          data={revisits.data}
          onEdit={(prescription, revisitDate) => setSelected({ prescription, revisitDate })}
        />
      ) : (
        <p role="status" className="rounded-[20px] bg-white p-6 text-sm">
          Đang tải lịch tái khám…
        </p>
      )}
      {selected && !revisits.isError && (
        <EditRevisitDateDialog profile={profile} session={session} {...selected} onClose={close} />
      )}
    </>
  );
}
