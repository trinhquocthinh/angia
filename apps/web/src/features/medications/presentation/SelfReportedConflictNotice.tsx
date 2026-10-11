import { useState } from 'react';
import type { CourseConflict, CreateSelfReportedCourseRequest } from '@angia/contracts';
import type { CourseChoices } from '../application/resolveCoursePrompt';
import { resolveSelfReportedConflict } from '../application/resolveSelfReportedConflict';
import { CourseConflictGroup } from './CourseConflictGroup';
type Props = {
  request: CreateSelfReportedCourseRequest;
  conflicts: CourseConflict[];
  pending: boolean;
  onSubmit: (request: CreateSelfReportedCourseRequest) => void;
  onCancel: () => void;
};
export function SelfReportedConflictNotice({ request, conflicts, pending, onSubmit, onCancel }: Props) {
  const [choices, setChoices] = useState<CourseChoices>({});
  const resolved = resolveSelfReportedConflict(request, conflicts, choices);
  const comparison = {
    data: {
      issuedDate: request.startDate,
      items: [
        {
          ...request,
          strength: request.strength ?? null,
          quantityPerDose: request.quantityPerDose ?? null,
          slots: request.slots ?? [],
        },
      ],
    },
  };
  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-[#fff4e5] p-4 text-sm leading-6 text-[#5c3a00]">
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
        className="min-h-11 rounded-xl bg-[#004135] px-4 font-semibold text-white disabled:opacity-55"
        onClick={() => {
          if (resolved) onSubmit(resolved);
        }}
      >
        {pending ? 'Đang lưu…' : 'Lưu với lựa chọn này'}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={onCancel}
        className="min-h-11 rounded-xl border border-[#b54708] px-4 font-semibold"
      >
        Sửa lại khai báo
      </button>
    </section>
  );
}
