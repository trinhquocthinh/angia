import type { components } from '@src/shared/api/schema.gen';
import type { AccountResult } from '../application/ports';
export function accountApiResult<T>({
  data,
  error,
  response,
}: {
  data?: T;
  error?: components['schemas']['ErrorResponse'];
  response: Response;
}): AccountResult<T> {
  if (response.ok && data) return { ok: true, data };
  const details = error?.error?.details;
  return {
    ok: false,
    code: error?.error?.code ?? 'UNKNOWN',
    ...(typeof details?.['field'] === 'string' ? { field: details['field'] } : {}),
    ...(details?.['current'] !== undefined ? { current: details['current'] } : {}),
  };
}
