import { Link } from '@tanstack/react-router';
import type { Prescription } from '@angia/contracts';
import { formatDay } from '@src/features/measurements/application/formatMeasurement';
import { vietnamToday } from '@src/features/measurements/application/seriesRange';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { SidePanel } from '@src/shared/ui/SidePanel';
import type { DocumentEntriesRepository } from '../../application/documentEntryPorts';
import { useReusePrescription } from '../../application/useReusePrescription';
import { ReusePrescriptionForm } from './ReusePrescriptionForm';

type Props = {
  prescription: Prescription;
  session: ProfileSession;
  repository: DocumentEntriesRepository;
  onClose: () => void;
};

// Sheet "Dùng lại đơn này" (SPEC-029); lưu xong báo số đợt đã tạo kèm link sang tab Thuốc điều trị.
export function ReusePrescriptionSheet({ prescription, session, repository, onClose }: Props) {
  const state = useReusePrescription(repository, session, prescription.healthProfileId, prescription.id);
  return (
    <SidePanel
      titleId="reuse-prescription-title"
      title="Dùng lại đơn này"
      subtitle={`Đơn kê ngày ${formatDay(prescription.issuedDate)} · tạo đợt thuốc mới từ các dòng đã chọn.`}
      closeLabel="Đóng Dùng lại đơn"
      pending={state.pending}
      onClose={onClose}
    >
      {state.saved ? (
        <div role="status" className="mx-6 mt-5 flex flex-col gap-3 rounded-xl bg-[#e4f0ef] p-4 text-sm">
          <p>Đã tạo {state.saved.length} đợt thuốc.</p>
          <Link
            to="/profiles/$profileId/medications"
            params={{ profileId: prescription.healthProfileId }}
            className="font-semibold text-[#004135] underline"
          >
            Xem tab Thuốc điều trị
          </Link>
        </div>
      ) : (
        <ReusePrescriptionForm prescription={prescription} today={vietnamToday(new Date())} state={state} />
      )}
    </SidePanel>
  );
}
