import type {
  DeletionCancelReason,
  DueDeletionRequest,
  FamilyDeletionDependencies,
  FamilyDeletionResult,
  FamilyDeletionStore,
} from './ports.js';

type Outcome = 'none' | 'cancelled' | 'executed';

function cancelReason(
  request: DueDeletionRequest,
  household: { ownerId: string | null; accountIds: string[] },
): DeletionCancelReason | null {
  const { ownerId, accountIds } = household;
  if (!ownerId || ownerId !== request.requestedBy || !accountIds.includes(ownerId)) return 'owner_changed';
  return accountIds.length > 1 ? 'family_not_empty' : null;
}

// SPEC-069: kiểm lại và xoá DB trong cùng transaction; object chỉ xoá sau COMMIT.
async function processDueRequest(store: FamilyDeletionStore): Promise<Outcome> {
  const request = await store.lockDue();
  if (!request) return 'none';
  const reason = cancelReason(request, await store.readHousehold());
  if (reason) {
    await store.cancel(request.id, reason);
    await store.audit('family_deletion_revoked', request, { reason });
    return 'cancelled';
  }
  for (const profileId of await store.deleteFamily(request.id)) await store.enqueuePurge(profileId);
  await store.enqueueFamilySweep();
  await store.audit('family_deletion_executed', request);
  return 'executed';
}

// Lỗi S3 không hoàn tác DB đã COMMIT: job purge-profile-objects đã enqueue cùng transaction sẽ vét lại.
async function purgeFamilyObjects(deps: FamilyDeletionDependencies, familyId: string): Promise<void> {
  try {
    for await (const { key } of deps.storage.list(`families/${familyId}/`)) await deps.storage.delete(key);
  } catch (error) {
    const reason = error instanceof Error ? error.name : 'unknown';
    deps.logger.warn({ familyId, reason }, 'Chưa xoá hết object của nhà đã xoá; chờ job vét');
  }
}

export async function executeFamilyDeletion(deps: FamilyDeletionDependencies): Promise<FamilyDeletionResult> {
  const result = { executed: 0, cancelled: 0, failed: 0 };
  for (const familyId of await deps.repository.listDueFamilyIds()) {
    let outcome: Outcome;
    try {
      outcome = await deps.repository.withFamily(familyId, processDueRequest);
    } catch (error) {
      // Một nhà lỗi (DB đã rollback nguyên vẹn) không chặn nhà khác; lượt 5 phút sau thử lại.
      result.failed += 1;
      deps.logger.error(
        { familyId, reason: error instanceof Error ? error.name : 'unknown' },
        'Không xoá được nhà đến hạn',
      );
      continue;
    }
    if (outcome === 'executed') {
      result.executed += 1;
      await purgeFamilyObjects(deps, familyId);
    } else if (outcome === 'cancelled') result.cancelled += 1;
  }
  return result;
}
