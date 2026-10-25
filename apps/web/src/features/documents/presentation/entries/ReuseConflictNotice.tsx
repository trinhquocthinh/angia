import type { CourseConflict, Prescription, ReusePrescriptionRequest } from '@angia/contracts';
import { CourseConflictDialog } from '@src/features/medications/presentation/CourseConflictDialog';
import { resolveReuseConflict } from '../../application/resolveReuseConflict';

type Props = {
  prescription: Prescription;
  request: ReusePrescriptionRequest;
  conflicts: CourseConflict[];
  pending: boolean;
  onSubmit: (request: ReusePrescriptionRequest) => void;
  onCancel: () => void;
};

// SPEC-015 trong Dùng lại đơn: liệt kê đủ đợt cũ, không chọn mặc định; chỉ lưu khi mọi nhóm đã chọn.
export function ReuseConflictNotice({
  prescription,
  request,
  conflicts,
  pending,
  onSubmit,
  onCancel,
}: Props) {
  const comparison = {
    data: {
      issuedDate: request.startDate,
      items: request.items.map((selected) =>
        prescription.items.find((item) => item.id === selected.prescriptionItemId)!,
      ),
    },
  };
  return (
    <CourseConflictDialog
      conflicts={conflicts}
      comparison={comparison}
      resolve={(choices) => resolveReuseConflict(request, conflicts, choices)}
      pending={pending}
      cancelLabel="Sửa lại lựa chọn"
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  );
}
