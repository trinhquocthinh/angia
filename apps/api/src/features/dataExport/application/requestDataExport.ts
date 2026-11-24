import { checkRateLimit } from '@src/shared/rateLimit/application/checkRateLimit.js';
import { recordRateLimitHit } from '@src/shared/rateLimit/application/recordRateLimitHit.js';
import { rateLimitPolicies } from '@src/shared/rateLimit/domain/rateLimitPolicies.js';
import type { DataExportRepository, ExportRequestResult, RequestExportInput } from './ports.js';

export async function requestDataExport(
  repository: DataExportRepository,
  input: RequestExportInput,
): Promise<ExportRequestResult> {
  return repository.withRequest(input.accountId, async (session) => {
    const policy = rateLimitPolicies.data_export_request;
    const limit = await checkRateLimit(session.rateLimit, policy, input.accountId);
    if (limit.blocked)
      return { ok: false, code: 'ERR_RATE_LIMITED', retryAfterSeconds: limit.retryAfterSeconds };
    if (
      input.profileId !== null &&
      (input.role !== 'main' ||
        !input.familyId ||
        !(await session.profileAllowed(input.familyId, input.profileId, input.accountId)))
    ) {
      return { ok: false, code: 'ERR_NOT_FOUND' };
    }
    const exportId = await session.enqueue(input.profileId);
    await recordRateLimitHit(session.rateLimit, policy, input.accountId);
    return { ok: true, exportId };
  });
}
