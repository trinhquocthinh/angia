import { AdminRequestError } from '../application/AdminRequestError';

export function readAdminResponse<T>(result: {
  response: Response;
  data?: T;
  error?: { error: { code: string } };
}): T {
  const { response, data, error } = result;
  if (!response.ok || data === undefined || data === null) {
    const code =
      response.status === 401
        ? 'ERR_UNAUTHENTICATED'
        : response.status === 403
          ? 'ERR_FORBIDDEN'
          : (error?.error.code ?? 'ERR_INTERNAL');
    throw new AdminRequestError(code, response.status);
  }
  return data;
}
