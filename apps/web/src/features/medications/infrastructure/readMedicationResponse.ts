import {
  courseConflictErrorResponseSchema,
  errorResponseSchema,
  medicationCourseSchema,
} from '@angia/contracts';
import { MedicationRequestError } from '../application/MedicationRequestError';

export function readMedicationResponse(result: { response: Response; data?: unknown; error?: unknown }) {
  if (result.response.ok) return medicationCourseSchema.parse(result.data);
  const error = errorResponseSchema.safeParse(result.error);
  const conflict =
    result.response.status === 409 ? courseConflictErrorResponseSchema.safeParse(result.error) : null;
  throw new MedicationRequestError(
    result.response.status < 500 && error.success
      ? error.data.error.message
      : 'Không thể lưu thuốc bổ. Vui lòng thử lại.',
    result.response.status,
    error.success ? error.data.error.code : undefined,
    conflict?.success ? conflict.data.error.details.conflicts : [],
  );
}
