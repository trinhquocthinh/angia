import type { ApproveDocumentRequest } from '@src/features/documents/application/reviewPorts';
import type { CourseConflictPrompt } from '../application/courseConflictPrompt';
import { resolveCoursePrompt } from '../application/resolveCoursePrompt';
import { CourseConflictDialog } from './CourseConflictDialog';

type Props = {
  prompt: CourseConflictPrompt;
  pending: boolean;
  onSubmit: (request: ApproveDocumentRequest) => void;
  onCancel: () => void;
};

export function CourseConflictNotice({ prompt, pending, onSubmit, onCancel }: Props) {
  return (
    <CourseConflictDialog
      intro={
        <>
          Đây là bản đối soát bạn vừa gửi. Chọn rõ cách xử lý cho từng nhóm thuốc; muốn đổi nội dung đơn, chọn{' '}
          <strong>Sửa lại đơn</strong>.
        </>
      }
      conflicts={prompt.conflicts}
      comparison={prompt.request}
      resolve={(choices) => resolveCoursePrompt(prompt, choices)}
      pending={pending}
      cancelLabel="Sửa lại đơn"
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  );
}
