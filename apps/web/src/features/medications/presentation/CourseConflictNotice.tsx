import { useState } from 'react';
import type { ApproveDocumentRequest } from '@src/features/documents/application/reviewPorts';
import type { CourseConflictPrompt } from '../application/courseConflictPrompt';
import { resolveCoursePrompt, type CourseChoices } from '../application/resolveCoursePrompt';
import { CourseConflictGroup } from './CourseConflictGroup';

type Props = {
  prompt: CourseConflictPrompt;
  pending: boolean;
  onSubmit: (request: ApproveDocumentRequest) => void;
  onCancel: () => void;
};

export function CourseConflictNotice({ prompt, pending, onSubmit, onCancel }: Props) {
  const [choices, setChoices] = useState<CourseChoices>({});
  const request = resolveCoursePrompt(prompt, choices);
  return (
    <section
      aria-labelledby="course-conflict-title"
      className="flex flex-col gap-4 rounded-2xl bg-[#fff4e5] p-4 text-sm leading-6 text-[#5c3a00]"
    >
      <h2 id="course-conflict-title" className="font-semibold" role="alert">
        Cần chọn cách xử lý thuốc trùng tên
      </h2>
      <p>
        Đây là bản đối soát bạn vừa gửi. Chọn rõ cách xử lý cho từng nhóm thuốc; muốn đổi nội dung đơn, chọn
        Sửa lại đơn.
      </p>
      {prompt.conflicts.map((conflict) => (
        <CourseConflictGroup
          key={conflict.nameNormalized}
          conflict={conflict}
          request={prompt.request}
          pending={pending}
          choice={choices[conflict.nameNormalized]}
          onChange={(value) => setChoices((current) => ({ ...current, [conflict.nameNormalized]: value }))}
        />
      ))}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending || !request}
          onClick={() => {
            if (request) onSubmit(request);
          }}
          className="min-h-11 rounded-xl bg-[#004135] px-4 font-semibold text-white disabled:opacity-55"
        >
          {pending ? 'Đang lưu…' : 'Lưu với lựa chọn này'}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onCancel}
          className="min-h-11 rounded-xl border border-[#b54708] px-4 font-semibold disabled:opacity-55"
        >
          Sửa lại đơn
        </button>
      </div>
    </section>
  );
}
