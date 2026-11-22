import { profileObjectPrefix } from '@angia/contracts';
import { checkRateLimit } from '@src/shared/rateLimit/application/checkRateLimit.js';
import { recordRateLimitHit } from '@src/shared/rateLimit/application/recordRateLimitHit.js';
import { rateLimitPolicies } from '@src/shared/rateLimit/domain/rateLimitPolicies.js';
import type { AccountDeletionDeps, AccountDeletionInput, AccountDeletionOutcome } from './deletionPorts.js';

export async function deleteAccount(
  deps: AccountDeletionDeps,
  input: AccountDeletionInput,
): Promise<AccountDeletionOutcome> {
  try {
    const credential = await deps.passwords.findCredential(input.accountId);
    if (!credential) return { ok: false, code: 'ERR_INVALID_CREDENTIALS' };
    const policy = rateLimitPolicies.login_failed;
    const key = { ip: input.ip, username: credential.usernameNormalized };
    const limit = await checkRateLimit(deps.rateLimit, policy, key);
    if (limit.blocked) {
      return { ok: false, code: 'ERR_RATE_LIMITED', retryAfterSeconds: limit.retryAfterSeconds };
    }
    if (!(await deps.hasher.verify(credential.passwordHash, input.password))) {
      await recordRateLimitHit(deps.rateLimit, policy, key);
      return { ok: false, code: 'ERR_INVALID_CREDENTIALS' };
    }
    const result = await deps.store.deleteAccount({
      accountId: input.accountId,
      expectedCredentialVersion: credential.credentialVersion,
      usernameHash: deps.hashUsername(credential.usernameNormalized),
      ownProfileDisposition: input.ownProfileDisposition,
    });
    if (!result.ok) return result;
    if (result.familyId && result.deletedProfileId) {
      try {
        await deps.storage.deletePrefix(profileObjectPrefix(result.familyId, result.deletedProfileId));
      } catch (error) {
        deps.logger.warn(
          {
            familyId: result.familyId,
            profileId: result.deletedProfileId,
            reason: error instanceof Error ? error.name : 'unknown',
          },
          'Chưa xoá xong ảnh khi xoá tài khoản; chờ job vét',
        );
      }
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      code: 'ERR_AUTH_UNAVAILABLE',
      reason: error instanceof Error ? error.name : 'unknown',
    };
  }
}
