import { resolveExportScope } from '../domain/resolveExportScope.js';
import { exportEntries } from './exportEntries.js';
import type { DataExportDependencies, ExportOutcome } from './ports.js';

// Chỉ phạm vi không hợp lệ mới failed; lỗi hạ tầng thoát transaction để pg-boss retry.
export async function buildDataExport(
  deps: DataExportDependencies,
  exportId: string,
): Promise<ExportOutcome> {
  return deps.repository.withPending(exportId, async (session) => {
    const account = await session.getAccount();
    const targetId = session.request.profileId ?? account.healthProfileId;
    const profile =
      account.familyId && targetId ? await session.getProfile(account.familyId, targetId, account.id) : null;
    const scope = resolveExportScope(account, session.request.profileId, profile);
    if (scope === false) {
      await session.markFailed();
      return 'failed';
    }
    const key = `exports/${exportId}.zip`;
    await deps.archive.write(key, exportEntries(deps, session, account, scope));
    await session.markReady(key);
    return 'ready';
  });
}
