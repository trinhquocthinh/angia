import type { MembershipActor } from './membershipPorts.js';

export type DeletionActor = MembershipActor & { familyId: string };
type DeletionFailure =
  | {
      ok: false;
      code:
        | 'ERR_FORBIDDEN'
        | 'ERR_UNAUTHENTICATED'
        | 'ERR_NOT_FOUND'
        | 'ERR_VALIDATION'
        | 'ERR_FAMILY_NOT_EMPTY'
        | 'ERR_DELETION_PENDING';
    }
  | { ok: false; code: 'ERR_RECENT_REMOVAL'; allowedAt: Date };
export type DeletionRevokeResult =
  { ok: true } | { ok: false; code: 'ERR_FORBIDDEN' | 'ERR_UNAUTHENTICATED' | 'ERR_NOT_FOUND' };
export type DeletionRequestResult =
  { ok: true; request: { id: string; status: 'pending'; executeAt: Date } } | DeletionFailure;

export interface HouseholdDeletionRepository {
  current(actor: DeletionActor): Promise<CurrentDeletionRequestResult>;
  request(actor: DeletionActor, confirmFamilyName: string): Promise<DeletionRequestResult>;
  revoke(actor: DeletionActor, requestId: string): Promise<DeletionRevokeResult>;
}

export type CurrentDeletionRequestResult =
  | { ok: true; request: { id: string; status: 'pending'; executeAt: Date } }
  | { ok: false; code: 'ERR_NOT_FOUND' | 'ERR_FORBIDDEN' | 'ERR_UNAUTHENTICATED' };
