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
      <p role="alert" className="profile-bento-card p-6 text-body text-text-primary">
        Hồ sơ chưa được đồng ý lưu dữ liệu.
      </p>
    );
  return (
    <>
      {revisits.isError ? (
        <div
          role="alert"
          className="profile-bento-card flex flex-col items-start gap-3 border border-danger/20 bg-danger-soft p-6 text-caption text-text-primary"
        >
          <p className="text-body font-medium">Không thể tải lịch tái khám. Vui lòng thử lại.</p>
          <button
            type="button"
            onClick={() => void revisits.refetch()}
            className="min-h-btn cursor-pointer rounded-2xl bg-accent px-5 text-button-primary font-semibold text-on-accent shadow-stitch-sm transition-colors hover:bg-accent-hover"
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
        <div role="status" className="profile-bento-card space-y-3 p-6 text-body text-text-secondary">
          <p>Đang tải lịch tái khám…</p>
          <div className="h-16 animate-pulse rounded-2xl bg-surface-container motion-reduce:animate-none" />
        </div>
      )}
      {selected && !revisits.isError && (
        <EditRevisitDateDialog profile={profile} session={session} {...selected} onClose={close} />
      )}
    </>
  );
}
