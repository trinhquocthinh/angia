import { decideWithdrawal } from '../domain/decideWithdrawal.js';
import type { MyConsentRepository, WithdrawMyConsentOutcome } from './ports.js';

// SPEC-036: khóa dòng hồ sơ rồi mới kiểm trạng thái để hai lệnh rút đồng thời chỉ một lệnh thắng.
export async function withdrawMyConsent(
  repository: MyConsentRepository,
  actor: { familyId: string; accountId: string; healthProfileId: string | null },
  now: () => Date,
): Promise<WithdrawMyConsentOutcome> {
  const { healthProfileId } = actor;
  if (!healthProfileId) return { ok: false, code: 'ERR_NOT_FOUND' };
  return repository.withFamily(actor.familyId, async (store) => {
    const profile = await store.lockProfile(healthProfileId);
    const decision = decideWithdrawal({ linkedProfileId: healthProfileId, profile });
    if (decision !== 'withdraw') return { ok: false, code: decision };
    const withdrawnAt = now();
    await store.markWithdrawn(healthProfileId, actor.accountId, withdrawnAt);
    return { ok: true, value: { consentStatus: 'withdrawn', withdrawnAt } };
  });
}
