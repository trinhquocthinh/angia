import { ReviewRequestError, type DuplicateRecord } from '../application/ReviewRequestError';

type ErrorDetails = { fields?: unknown; invalidItemIndexes?: unknown } & Partial<
  Record<keyof DuplicateRecord, unknown>
>;
type ErrorBody = { error?: { message?: string; code?: string; details?: ErrorDetails } };

const listOf = <T>(value: unknown, guard: (item: unknown) => item is T): T[] =>
  Array.isArray(value) ? value.filter(guard) : [];
const isString = (item: unknown): item is string => typeof item === 'string';
const isIndex = (item: unknown): item is number => Number.isInteger(item) && (item as number) >= 0;

const isNullableString = (value: unknown): value is string | null => value === null || isString(value);

function readDuplicate(details: ErrorDetails | undefined): DuplicateRecord | null {
  const { duplicateOf, recordDate, facility, savedAt } = details ?? {};
  if (!isNullableString(duplicateOf) || !isString(recordDate) || !isString(savedAt)) return null;
  return { duplicateOf, recordDate, facility: isNullableString(facility) ? facility : null, savedAt };
}

export async function readReviewResponse<T>(result: {
  data?: T;
  response: Response;
  error?: unknown;
}): Promise<T> {
  if (result.response.ok && result.data !== undefined) return result.data;
  const body = result.error as ErrorBody | undefined;
  const details = body?.error?.details;
  throw new ReviewRequestError(
    result.response.status < 500 && body?.error?.message
      ? body.error.message
      : 'Không thể tải hoặc lưu chứng từ. Vui lòng thử lại.',
    result.response.status,
    body?.error?.code,
    listOf(details?.fields, isString),
    listOf(details?.invalidItemIndexes, isIndex),
    readDuplicate(details),
  );
}
