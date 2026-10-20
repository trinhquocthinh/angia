import { planIdpSync } from '../domain/planIdpSync.js';
import { IdpDirectoryError } from './IdpDirectoryError.js';
import type { IdpSyncDependencies, IdpSyncPolicy, IdpSyncResult } from './ports.js';

const NO_CHANGE = { revoke: [], adminOn: [], adminOff: [], capped: false };

// SPEC-033: đọc đủ hai nhóm rồi mới chạm DB; IdP lỗi → không đổi gì (fail-open). Không bao giờ ném lỗi.
export async function syncIdpSessions(
  deps: IdpSyncDependencies,
  policy: IdpSyncPolicy,
): Promise<IdpSyncResult> {
  const { dryRun } = policy;
  let access, admins;
  try {
    [access, admins] = await Promise.all([
      deps.directory.fetchGroupMembers(policy.accessGroupName),
      deps.directory.fetchGroupMembers(policy.adminGroupName),
    ]);
  } catch (error) {
    if (!(error instanceof IdpDirectoryError))
      return { ...NO_CHANGE, outcome: 'error', reason: 'idp_unreachable', dryRun };
    const status = error.status === undefined ? {} : { status: error.status };
    return { ...NO_CHANGE, outcome: 'error', reason: error.reason, ...status, dryRun };
  }
  try {
    const accounts = await deps.store.listAccounts(policy.now());
    const { skipReason, ...plan } = planIdpSync({ accounts, access, admins, maxRevokes: policy.maxRevokes });
    if (skipReason) return { ...plan, outcome: 'skipped', reason: skipReason, dryRun };
    const { revoke, adminOn, adminOff } = plan;
    if (!dryRun && revoke.length + adminOn.length + adminOff.length > 0)
      await deps.store.apply({ revoke, adminOn, adminOff });
    return { ...plan, outcome: 'applied', dryRun };
  } catch {
    return { ...NO_CHANGE, outcome: 'error', reason: 'db_error', dryRun };
  }
}
