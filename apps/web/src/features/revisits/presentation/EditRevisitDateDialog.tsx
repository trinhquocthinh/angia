import { useState } from 'react';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import { ReadingField } from '@src/features/documents/presentation/components/ReadingField';
import { formatDay } from '@src/features/measurements/application/formatMeasurement';
import { ModalDialog } from '@src/shared/ui/ModalDialog';
import { useSetRevisitDate } from '../application/useSetRevisitDate';
import type { RevisitPrescription } from '../application/ports';
import { createRevisitRepository } from '../infrastructure/createRevisitRepository';

const repository = createRevisitRepository();
type Props = {
  profile: HealthProfile;
  session: ProfileSession;
  prescription: RevisitPrescription;
  revisitDate: string;
  onClose: () => void;
};
function EditRevisitHeader({ saving, onClose }: { saving: boolean; onClose: () => void }) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-border/35 px-5 py-4">
      <h2 id="edit-revisit-title" className="auth-heading text-heading-2 font-semibold text-accent">
        Sửa ngày hẹn tái khám
      </h2>
      <button
        type="button"
        disabled={saving}
        onClick={onClose}
        className="inline-flex min-h-11 cursor-pointer items-center rounded-2xl border border-border/45 bg-bg px-4 text-caption font-semibold text-text-secondary transition-colors hover:bg-accent-soft hover:text-accent disabled:opacity-50"
      >
        Đóng
      </button>
    </header>
  );
}

export function EditRevisitDateDialog({ profile, session, prescription, revisitDate, onClose }: Props) {
  const [value, setValue] = useState(revisitDate);
  const edit = useSetRevisitDate(repository, session, profile, prescription);
  const submit = async () => {
    if (await edit.save(value)) onClose();
  };
  return (
    <ModalDialog labelledBy="edit-revisit-title" pending={edit.saving} onCancel={onClose} width="md">
      <EditRevisitHeader saving={edit.saving} onClose={onClose} />
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className="flex min-h-0 flex-col"
      >
        <div className="overflow-y-auto p-5 sm:p-6">
          <p className="mb-5 rounded-2xl border border-border/35 bg-bg px-4 py-3 text-caption text-text-secondary tabular-nums">
            Đơn ngày {formatDay(prescription.issuedDate)}. Để trống ngày hẹn rồi lưu để xóa lịch hẹn của đơn
            này.
          </p>
          <fieldset disabled={edit.saving} className="flex flex-col gap-4 border-0 p-0">
            <ReadingField
              id="edit-revisit-date"
              type="date"
              label="Ngày hẹn tái khám"
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
            {edit.error && (
              <p role="alert" className="rounded-2xl bg-danger-soft p-3 text-body text-danger">
                {edit.error}
              </p>
            )}
          </fieldset>
        </div>
        <footer className="flex flex-wrap justify-end gap-3 border-t border-border/35 bg-surface px-5 py-4">
          <button
            type="button"
            disabled={edit.saving}
            onClick={onClose}
            className="min-h-btn cursor-pointer rounded-2xl border border-border/45 bg-bg px-5 text-button-secondary font-semibold text-text-primary transition-colors hover:bg-accent-soft disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={edit.saving}
            className="min-h-btn cursor-pointer rounded-2xl bg-accent px-5 text-button-primary font-semibold text-on-accent shadow-stitch-sm transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {edit.saving ? 'Đang lưu…' : 'Lưu ngày hẹn'}
          </button>
        </footer>
      </form>
    </ModalDialog>
  );
}
