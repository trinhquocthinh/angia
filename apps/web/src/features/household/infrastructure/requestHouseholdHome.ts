import type { HomeResult } from '../application/householdHomePorts';
import { extractHomeError } from './extractHomeError';

/** Chỉ GET current được coi 404 là trạng thái không có yêu cầu. */
export async function requestHouseholdHome<T>(
  task: () => Promise<{ response: Response; data?: T; error?: unknown }>,
  successStatus: number,
  emptyValue?: T,
): Promise<HomeResult<T>> {
  try {
    const { response, data, error } = await task();
    if (response.status === successStatus && (successStatus === 204 || data != null)) {
      return { ok: true, value: data as T };
    }
    if (response.status === 404 && emptyValue === null) return { ok: true, value: emptyValue };
    return { ok: false, error: extractHomeError(error) };
  } catch (error) {
    return { ok: false, error: { code: error instanceof SyntaxError ? 'UNKNOWN' : 'NETWORK' } };
  }
}
