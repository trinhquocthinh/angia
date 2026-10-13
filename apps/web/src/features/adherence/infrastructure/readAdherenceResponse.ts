import { errorResponseSchema } from '@angia/contracts';
import type { z } from 'zod';
import { AdherenceRequestError } from '../application/AdherenceRequestError';

export function readAdherenceResponse<T extends z.ZodType>(
  result: { response: Response; data?: unknown; error?: unknown },
  schema: T,
  fallback: string,
): z.infer<T> {
  if (result.response.ok) return schema.parse(result.data);
  const error = errorResponseSchema.safeParse(result.error);
  throw new AdherenceRequestError(
    result.response.status < 500 && error.success ? error.data.error.message : fallback,
    result.response.status,
    error.success ? error.data.error.code : undefined,
  );
}
