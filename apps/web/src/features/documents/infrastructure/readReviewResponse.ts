import { ReviewRequestError } from '../application/ReviewRequestError';

type ErrorBody = { error?: { message?: string; code?: string; details?: { fields?: unknown } } };

export async function readReviewResponse<T>(result: {
  data?: T;
  response: Response;
  error?: unknown;
}): Promise<T> {
  if (result.response.ok && result.data !== undefined) return result.data;
  const body = result.error as ErrorBody | undefined;
  const fields = body?.error?.details?.fields;
  throw new ReviewRequestError(
    result.response.status < 500 && body?.error?.message
      ? body.error.message
      : 'Không thể tải hoặc lưu chứng từ. Vui lòng thử lại.',
    result.response.status,
    body?.error?.code,
    Array.isArray(fields) ? fields.filter((field): field is string => typeof field === 'string') : [],
  );
}
