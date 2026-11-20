import { apiClient } from '@src/shared/api/apiClient';
import type {
  HouseholdHomeRepository,
  OwnershipOffer,
  DeletionRequest,
  OwnershipOfferCreated,
} from '../application/householdHomePorts';
import { requestHouseholdHome } from './requestHouseholdHome';

export const householdHomeRepository: HouseholdHomeRepository = {
  getCurrentOffer: () =>
    requestHouseholdHome<OwnershipOffer | null>(
      () => apiClient.GET('/api/family/ownership-offers/current'),
      200,
      null,
    ),
  sendOffer: (targetAccountId, csrfToken) =>
    requestHouseholdHome<OwnershipOfferCreated>(
      () =>
        apiClient.POST('/api/family/ownership-offers', {
          body: { targetAccountId },
          headers: { 'X-CSRF-Token': csrfToken },
        }),
      201,
    ),
  revokeOffer: (offerId, csrfToken) =>
    requestHouseholdHome<undefined>(
      () =>
        apiClient.DELETE('/api/family/ownership-offers/{id}', {
          params: { path: { id: offerId } },
          headers: { 'X-CSRF-Token': csrfToken },
        }),
      204,
    ),
  decideOffer: (offerId, accept, csrfToken) =>
    requestHouseholdHome<undefined>(
      () =>
        apiClient.POST('/api/family/ownership-offers/{id}/decision', {
          params: { path: { id: offerId } },
          body: { accept },
          headers: { 'X-CSRF-Token': csrfToken },
        }),
      204,
    ),
  leaveHousehold: (ownProfileDisposition, csrfToken) =>
    requestHouseholdHome<undefined>(
      () =>
        apiClient.POST('/api/family/leave', {
          body: { ownProfileDisposition },
          headers: { 'X-CSRF-Token': csrfToken },
        }),
      204,
    ),
  getCurrentDeletionRequest: () =>
    requestHouseholdHome<DeletionRequest | null>(
      () => apiClient.GET('/api/family/deletion-request/current'),
      200,
      null,
    ),
  requestDeletion: (confirmFamilyName, csrfToken) =>
    requestHouseholdHome<DeletionRequest>(
      () =>
        apiClient.POST('/api/family/deletion-request', {
          body: { confirmFamilyName },
          headers: { 'X-CSRF-Token': csrfToken },
        }),
      201,
    ),
  revokeDeletion: (requestId, csrfToken) =>
    requestHouseholdHome<undefined>(
      () =>
        apiClient.DELETE('/api/family/deletion-request', {
          body: { requestId },
          headers: { 'X-CSRF-Token': csrfToken },
        }),
      204,
    ),
};
