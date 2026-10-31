import {
  checkDeliveryEligibility,
  type DeliveryEligibility,
  type DeliveryEligibilityInput,
} from '../domain/checkDeliveryEligibility.js';
import { resolveDeliveryRecipientAccountIds } from './resolveDeliveryRecipientAccountIds.js';
import type { ReminderKind } from './ports.js';

// Kiểm lại trước từng lần gửi; không dùng lại tập người nhận đã đọc ở fan-out.
export function checkReminderDeliveryEligibility(
  kind: ReminderKind,
  input: DeliveryEligibilityInput,
): DeliveryEligibility {
  if (kind === 'medication') return checkDeliveryEligibility(input);
  if (input.deviceAccountId === null) return 'revoked_device';
  if (!input.consentConfirmed) return 'revoked_consent';
  const recipients = resolveDeliveryRecipientAccountIds(
    kind,
    input.profileId,
    input.familyAccounts,
    input.assignedAccountIds,
  );
  return recipients.includes(input.deviceAccountId) ? 'ok' : 'revoked_recipient';
}
