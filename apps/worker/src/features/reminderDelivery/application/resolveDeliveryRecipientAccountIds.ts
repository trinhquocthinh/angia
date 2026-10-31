import type { FamilyAccount } from '@src/shared/domain/FamilyAccount.js';
import { resolveRecipientAccountIds } from '@src/shared/domain/resolveRecipientAccountIds.js';
import type { ReminderKind } from './ports.js';

export function resolveDeliveryRecipientAccountIds(
  kind: ReminderKind,
  profileId: string,
  accounts: readonly FamilyAccount[],
  assigned: readonly string[],
): string[] {
  if (kind === 'medication') return resolveRecipientAccountIds(profileId, accounts, assigned);
  return [
    ...new Set(accounts.filter((a) => a.role === 'main' || a.healthProfileId === profileId).map((a) => a.id)),
  ];
}
