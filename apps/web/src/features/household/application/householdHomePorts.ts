export type OwnershipOffer = {
  id: string;
  status: 'pending';
  createdAt: string;
  offeredBy: { accountId: string; displayName: string };
  target: { accountId: string; displayName: string };
};

export type OwnershipOfferCreated = {
  id: string;
  targetAccountId: string;
  status: 'pending';
  createdAt: string;
};

export type DeletionRequest = {
  id: string;
  status: 'pending';
  executeAt: string;
};

export type OwnProfileDisposition = 'keep' | 'delete';

export type HouseholdHomeError = {
  code: string;
  details?: Record<string, unknown>;
};

export type HomeResult<T> = { ok: true; value: T } | { ok: false; error: HouseholdHomeError };

export type HomeActionOutcome =
  { status: 'ok' } | { status: 'error'; code: string; message: string } | { status: 'ignored' };

export type OwnershipTransferPorts = {
  sendOffer: (targetAccountId: string, csrfToken: string) => Promise<HomeResult<OwnershipOfferCreated>>;
  revokeOffer: (offerId: string, csrfToken: string) => Promise<HomeResult<undefined>>;
  decideOffer: (offerId: string, accept: boolean, csrfToken: string) => Promise<HomeResult<undefined>>;
};

export type LeaveHouseholdAction = (
  disposition: OwnProfileDisposition,
  csrfToken: string,
) => Promise<HomeResult<undefined>>;

export type DeletionRequestPorts = {
  requestDeletion: (confirmFamilyName: string, csrfToken: string) => Promise<HomeResult<DeletionRequest>>;
  revokeDeletion: (requestId: string, csrfToken: string) => Promise<HomeResult<undefined>>;
};

export type HouseholdHomeRepository = OwnershipTransferPorts &
  DeletionRequestPorts & {
    getCurrentOffer: () => Promise<HomeResult<OwnershipOffer | null>>;
    leaveHousehold: LeaveHouseholdAction;
    getCurrentDeletionRequest: () => Promise<HomeResult<DeletionRequest | null>>;
  };

export function ownershipOfferQueryKey(scope: string) {
  return ['household-ownership-offer', scope] as const;
}

export function deletionRequestQueryKey(scope: string) {
  return ['household-deletion-request', scope] as const;
}
