import { ProfileRequestError } from '../application/ProfileRequestError';
export async function readProfileResponse<T>(result: {
  data?: T;
  response: Response;
  error?: unknown;
}): Promise<T> {
  if (result.response.ok && result.data !== undefined) return result.data;
  const body = result.error as { error?: { message?: string; code?: string } } | undefined;
  throw new ProfileRequestError(
    result.response.status < 500 && body?.error?.message
      ? body.error.message
      : 'Không thể tải hoặc lưu hồ sơ. Vui lòng thử lại.',
    result.response.status,
    body?.error?.code,
  );
}
