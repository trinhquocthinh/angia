import type { FamilyAccount } from '@src/shared/domain/FamilyAccount.js';
import { resolveRecipientAccountIds } from '@src/shared/domain/resolveRecipientAccountIds.js';

export interface DeliveryEligibilityInput {
  /** Tài khoản sở hữu đăng ký push; null khi thiết bị đã bị gỡ (push_subscription_id SET NULL). */
  deviceAccountId: string | null;
  profileId: string;
  consentConfirmed: boolean;
  familyAccounts: FamilyAccount[];
  assignedAccountIds: string[];
}

export type DeliveryEligibility = 'ok' | 'revoked_device' | 'revoked_consent' | 'revoked_recipient';

// Spec §4 trạng thái revoked: kiểm theo thứ tự thiết bị → đồng thuận → người nhận hiện hành (BR-039).
export function checkDeliveryEligibility(input: DeliveryEligibilityInput): DeliveryEligibility {
  if (input.deviceAccountId === null) return 'revoked_device';
  if (!input.consentConfirmed) return 'revoked_consent';
  const recipients = resolveRecipientAccountIds(
    input.profileId,
    input.familyAccounts,
    input.assignedAccountIds,
  );
  return recipients.includes(input.deviceAccountId) ? 'ok' : 'revoked_recipient';
}
