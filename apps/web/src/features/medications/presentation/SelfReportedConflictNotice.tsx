import type { CourseConflict, CreateSelfReportedCourseRequest } from '@angia/contracts';
import { resolveSelfReportedConflict } from '../application/resolveSelfReportedConflict';
import { CourseConflictDialog } from './CourseConflictDialog';
type Props = {
  request: CreateSelfReportedCourseRequest;
  conflicts: CourseConflict[];
  pending: boolean;
  onSubmit: (request: CreateSelfReportedCourseRequest) => void;
  onCancel: () => void;
};
export function SelfReportedConflictNotice({ request, conflicts, pending, onSubmit, onCancel }: Props) {
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
    <CourseConflictDialog
      conflicts={conflicts}
      comparison={comparison}
      resolve={(choices) => resolveSelfReportedConflict(request, conflicts, choices)}
      pending={pending}
      cancelLabel="Sửa lại thông tin"
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  );
}
