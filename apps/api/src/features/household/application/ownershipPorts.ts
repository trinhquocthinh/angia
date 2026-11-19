import type { MembershipActor } from './membershipPorts.js';

export type OwnershipActor = MembershipActor & { familyId: string };
type OwnershipFailure = {
  ok: false;
  code:
    | 'ERR_FORBIDDEN'
    | 'ERR_UNAUTHENTICATED'
    | 'ERR_NOT_FOUND'
    | 'ERR_VALIDATION'
    | 'ERR_OWNERSHIP_TRANSFER_PENDING';
};
export type OwnershipResult = { ok: true } | OwnershipFailure;
export type OwnershipOfferResult =
  | {
      ok: true;
      offer: { id: string; targetAccountId: string; status: 'pending'; createdAt: Date };
    }
  | OwnershipFailure;

export interface HouseholdOwnershipRepository {
  offer(actor: OwnershipActor, targetAccountId: string): Promise<OwnershipOfferResult>;
  decide(actor: OwnershipActor, offerId: string, accept: boolean): Promise<OwnershipResult>;
  revoke(actor: OwnershipActor, offerId: string): Promise<OwnershipResult>;
}
