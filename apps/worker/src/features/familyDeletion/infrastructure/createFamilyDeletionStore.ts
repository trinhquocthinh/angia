import {
  PURGE_PENDING_OBJECTS_QUEUE,
  PURGE_PROFILE_OBJECTS_DELAY_SECONDS,
  PURGE_PROFILE_OBJECTS_QUEUE,
} from '@angia/contracts';
import type pg from 'pg';
import { v7 as newId } from 'uuid';
import type { PgBoss } from 'pg-boss';
import type { FamilyDeletionStore } from '../application/ports.js';
import { deleteStoredFamily } from './deleteStoredFamily.js';
import { enterFamilyDeletionRole } from './resolveFamilyDeletionRole.js';

export function createFamilyDeletionStore(
  client: pg.PoolClient,
  familyId: string,
  boss: PgBoss,
): FamilyDeletionStore {
  const db = { executeSql: (text: string, values?: unknown[]) => client.query(text, values) };
  const send = async (queue: string, data: object, options: { startAfter?: number }) => {
    if (!(await boss.send(queue, data, { db, ...options }))) throw new Error('purge_enqueue_failed');
  };
  let household = { ownerId: null as string | null, accountIds: [] as string[] };
  return {
    lockDue: async () => {
      // Cùng thứ tự API (lockHouseholdOwnership): account theo UUID → family → yêu cầu.
      const accounts = await client.query<{ id: string }>(
        'SELECT id FROM accounts WHERE family_id=$1 ORDER BY id FOR UPDATE',
        [familyId],
      );
      const family = await client.query<{ owner_account_id: string | null }>(
        'SELECT owner_account_id FROM families WHERE id=$1 FOR UPDATE',
        [familyId],
      );
      household = {
        ownerId: family.rows[0]?.owner_account_id ?? null,
        accountIds: accounts.rows.map((row) => row.id),
      };
      if (!family.rows[0]) return null;
      const due = await client.query<{ id: string; requested_by: string }>(
        `SELECT id,requested_by FROM family_deletion_requests
         WHERE family_id=$1 AND status='pending' AND execute_at<=now() FOR UPDATE`,
        [familyId],
      );
      const row = due.rows[0];
      if (!row) return null;
      // Role xoá nhà không có FOR UPDATE trên accounts/families nên khoá xong mới chuyển role.
      await enterFamilyDeletionRole(client);
      return { id: row.id, requestedBy: row.requested_by };
    },
    readHousehold: async () => household,
    cancel: async (requestId, reason) => {
      await client.query(
        "UPDATE family_deletion_requests SET status='revoked',revoked_at=now(),cancel_reason=$2 WHERE id=$1",
        [requestId, reason],
      );
    },
    deleteFamily: (requestId) => deleteStoredFamily(client, familyId, requestId),
    // Cùng transaction: COMMIT thì job vét chắc chắn có, rollback thì không (SPEC-007).
    enqueuePurge: (profileId) =>
      send(
        PURGE_PROFILE_OBJECTS_QUEUE,
        { familyId, profileId },
        { startAfter: PURGE_PROFILE_OBJECTS_DELAY_SECONDS },
      ),
    enqueueFamilySweep: () => send(PURGE_PENDING_OBJECTS_QUEUE, { familyId }, {}),
    audit: async (action, request, metadata = {}) => {
      await client.query(
        `INSERT INTO admin_audit_events(id,actor_account_id,family_id,target_account_id,action,metadata)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [newId(), request.requestedBy, familyId, request.requestedBy, action, JSON.stringify(metadata)],
      );
    },
  };
}
