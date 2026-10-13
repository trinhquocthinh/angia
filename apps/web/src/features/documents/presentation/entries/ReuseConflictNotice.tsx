import { useState } from 'react';
import type { CourseConflict, Prescription, ReusePrescriptionRequest } from '@angia/contracts';
import type { CourseChoices } from '@src/features/medications/application/resolveCoursePrompt';
import { CourseConflictGroup } from '@src/features/medications/presentation/CourseConflictGroup';
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
  const [choices, setChoices] = useState<CourseChoices>({});
  const resolved = resolveReuseConflict(request, conflicts, choices);
  const comparison = {
    data: {
      issuedDate: request.startDate,
      items: request.items.map((selected) =>
        prescription.items.find((item) => item.id === selected.prescriptionItemId)!,
      ),
    },
  };
  return (
    <section className="flex flex-col gap-4 rounded-xl bg-[#ffdbc9] p-4 text-sm leading-6 text-[#321200]">
      <h3 role="alert" className="font-semibold">
        Cần chọn cách xử lý thuốc trùng tên
      </h3>
      {conflicts.map((conflict) => (
        <CourseConflictGroup
          key={conflict.nameNormalized}
          conflict={conflict}
          request={comparison}
          pending={pending}
          choice={choices[conflict.nameNormalized]}
          onChange={(value) => setChoices((current) => ({ ...current, [conflict.nameNormalized]: value }))}
        />
      ))}
      <button
        type="button"
        disabled={pending || !resolved}
        onClick={() => resolved && onSubmit(resolved)}
        className="min-h-11 rounded-xl bg-[#004135] px-4 font-semibold text-white disabled:opacity-55"
      >
        {pending ? 'Đang lưu…' : 'Lưu với lựa chọn này'}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={onCancel}
        className="min-h-11 rounded-xl border border-[#602900] px-4 font-semibold"
      >
        Sửa lại lựa chọn
      </button>
    </section>
  );
}
