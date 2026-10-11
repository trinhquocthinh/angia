import { useCourseConflictPrompt } from '@src/features/medications/application/useCourseConflictPrompt';
import { CourseConflictNotice } from '@src/features/medications/presentation/CourseConflictNotice';
import type { components } from '@src/shared/api/schema.gen';
import type { ApproveDocumentRequest, ReviewRepository } from '../../application/reviewPorts';
import { ReviewRequestError } from '../../application/ReviewRequestError';
import { useDuplicatePrompt } from '../../application/useDuplicatePrompt';
import { useApproveDocument } from '../../application/useReviewWorkspace';
import { DuplicateNotice } from './DuplicateNotice';
import { RejectDocumentControl } from './RejectDocumentControl';
import { ReviewDetailBody } from './ReviewDetailBody';

type DocumentReview = components['schemas']['DocumentReview'];
type ReviewFormColumnProps = DocumentReview & {
  repository: ReviewRepository;
  session: components['schemas']['MeContextResponse'];
  onDone: () => void;
};

// Cột form đối soát: lưu (nghi trùng thì hỏi "Vẫn lưu bản này" — SPEC-012) hoặc loại bỏ, xong thì sang chứng từ kế.
export function ReviewFormColumn({
  repository,
  session,
  document,
  extraction,
  onDone,
}: ReviewFormColumnProps) {
  const approve = useApproveDocument(repository, session, document.id);
  const save = (request: ApproveDocumentRequest) => approve.mutate(request, { onSuccess: onDone });
  const error = approve.error instanceof ReviewRequestError ? approve.error : null;
  const courses = useCourseConflictPrompt(save, error);
  const duplicate = useDuplicatePrompt(courses.submit, courses.formError);
  const rejectable = document.status === 'pending_review' || document.status === 'manual_entry';
  return (
    <div className="flex flex-col gap-4">
      <fieldset disabled={approve.isPending || Boolean(courses.prompt)} className="min-w-0 border-0 p-0">
        <ReviewDetailBody
          document={document}
          extraction={extraction}
          pending={approve.isPending}
          error={duplicate.formError}
          onSubmit={duplicate.submit}
        />
      </fieldset>
      {courses.prompt && (
        <CourseConflictNotice
          key={JSON.stringify(courses.prompt)}
          prompt={courses.prompt}
          pending={approve.isPending}
          onSubmit={duplicate.submit}
          onCancel={() => approve.reset()}
        />
      )}
      {duplicate.prompt && (
        <DuplicateNotice
          duplicate={duplicate.prompt.record}
          type={duplicate.prompt.type}
          pending={approve.isPending}
          onConfirm={() => duplicate.submit(duplicate.prompt!.request)}
        />
      )}
      {rejectable && (
        <RejectDocumentControl
          key={document.id}
          {...{ repository, session, documentId: document.id }}
          onRejected={onDone}
        />
      )}
    </div>
  );
}
