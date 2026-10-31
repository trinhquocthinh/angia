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
export function EditRevisitDateDialog({ profile, session, prescription, revisitDate, onClose }: Props) {
  const [value, setValue] = useState(revisitDate);
  const edit = useSetRevisitDate(repository, session, profile, prescription);
  const submit = async () => {
    if (await edit.save(value)) onClose();
  };
  return (
    <ModalDialog labelledBy="edit-revisit-title" pending={edit.saving} onCancel={onClose} width="md">
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className="overflow-y-auto p-6"
      >
        <h2 id="edit-revisit-title" className="auth-heading text-2xl font-semibold">
          Sửa ngày hẹn tái khám
        </h2>
        <p className="mt-2 mb-5 text-sm text-[#55615f]">
          Đơn ngày {formatDay(prescription.issuedDate)}. Để trống ngày hẹn rồi lưu để xóa lịch hẹn của đơn
          này.
        </p>
        <fieldset disabled={edit.saving} className="flex flex-col gap-5">
          <ReadingField
            id="edit-revisit-date"
            type="date"
            label="Ngày hẹn tái khám"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          {edit.error && (
            <p role="alert" className="text-sm text-[#b42318]">
              {edit.error}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 rounded-full bg-[#eaf6f5] px-5 text-sm font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="min-h-11 rounded-full bg-[#004135] px-5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {edit.saving ? 'Đang lưu…' : 'Lưu ngày hẹn'}
            </button>
          </div>
        </fieldset>
      </form>
    </ModalDialog>
  );
}
