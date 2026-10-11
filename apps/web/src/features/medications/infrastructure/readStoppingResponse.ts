import { errorResponseSchema } from '@angia/contracts';
import { MedicationRequestError } from '../application/MedicationRequestError';
export function readStoppingResponse(result: { response: Response; data?: unknown; error?: unknown }) {
  if (result.response.ok) return result.data;
  const parsed = errorResponseSchema.safeParse(result.error);
  throw new MedicationRequestError(
    result.response.status < 500 && parsed.success
      ? parsed.data.error.message
      : 'Không thể ghi nhận dừng thuốc. Vui lòng thử lại.',
    result.response.status,
    parsed.success ? parsed.data.error.code : undefined,
  );
}
