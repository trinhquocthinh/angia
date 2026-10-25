import { useState, type ComponentProps, type ReactNode } from 'react';
import type { CourseConflict } from '@angia/contracts';
import { DocumentIcon } from '@src/features/documents/presentation/components/DocumentIcon';
import { ModalDialog } from '@src/shared/ui/ModalDialog';
import { ModalHeader } from '@src/shared/ui/ModalHeader';
import type { CourseChoices } from '../application/resolveCoursePrompt';
import { CourseConflictFooter } from './CourseConflictFooter';
import { CourseConflictGroup } from './CourseConflictGroup';

type Props<T> = {
  intro?: ReactNode;
  conflicts: readonly CourseConflict[];
  /** Bản đã gửi để đối chiếu dòng mới theo `itemIndexes`. */
  comparison: ComponentProps<typeof CourseConflictGroup>['request'];
  /** Trả lệnh lưu khi mọi nhóm đã chọn, ngược lại null/undefined. */
  resolve: (choices: CourseChoices) => T | null | undefined;
  pending: boolean;
  cancelLabel: string;
  onSubmit: (request: T) => void;
  onCancel: () => void;
};

// Hộp thoại SPEC-015 theo Stitch 6ea48325 (mobile: bottom sheet bf67ecac). Không nhãn "khuyên dùng",
// không chọn sẵn (BR-033, SPEC-015). Escape/nút đóng = hủy đối soát như nút sửa lại.
export function CourseConflictDialog<T>(props: Props<T>) {
  const { intro, conflicts, comparison, resolve, pending, cancelLabel, onSubmit, onCancel } = props;
  const [choices, setChoices] = useState<CourseChoices>({});
  const resolved = resolve(choices);
  return (
    <ModalDialog labelledBy="course-conflict-title" onCancel={onCancel} pending={pending} width="lg">
      <ModalHeader
        titleId="course-conflict-title"
        tone="warning"
        icon={<DocumentIcon name="prescription" size={22} />}
        title="Cần chọn cách xử lý thuốc trùng tên"
        subtitle="Hồ sơ đang có đợt thuốc cùng tên còn hiệu lực."
        closeLabel={cancelLabel}
        pending={pending}
        onClose={onCancel}
      />
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 pb-4 text-sm leading-6 max-md:px-5">
        {intro && (
          <p className="flex gap-3 rounded-2xl bg-[#e4f0f0] p-4 text-[#20594b]">
            <span className="mt-0.5">
              <DocumentIcon name="checkCircle" size={18} />
            </span>
            <span>{intro}</span>
          </p>
        )}
        {conflicts.map((conflict, index) => (
          <CourseConflictGroup
            key={conflict.nameNormalized}
            conflict={conflict}
            request={comparison}
            pending={pending}
            index={index}
            choice={choices[conflict.nameNormalized]}
            onChange={(value) => setChoices((current) => ({ ...current, [conflict.nameNormalized]: value }))}
          />
        ))}
      </div>
      <CourseConflictFooter
        canSave={Boolean(resolved)}
        pending={pending}
        cancelLabel={cancelLabel}
        onSave={() => {
          if (resolved) onSubmit(resolved);
        }}
        onCancel={onCancel}
      />
    </ModalDialog>
  );
}
