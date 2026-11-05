import { errorResponseSchema } from '@angia/contracts';
import { readAdminResponse } from '@src/features/family/infrastructure/readAdminResponse';
export function readScanQuotaResponse(result: {
  response: Response;
  data?: unknown;
  error?: unknown;
}): unknown {
  const error = errorResponseSchema.safeParse(result.error);
  return readAdminResponse({
    response: result.response,
    data: result.data,
    ...(error.success ? { error: error.data } : {}),
  });
}
