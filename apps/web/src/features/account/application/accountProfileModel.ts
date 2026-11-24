import type { components } from '@src/shared/api/schema.gen';
import { memberRoleLabel } from '@src/features/household/application/memberDisplay';

type ProfileSession = Pick<components['schemas']['MeContextResponse'], 'account' | 'family' | 'role'>;

export type AccountProfileModel = {
  initial: string;
  displayName: string;
  familyName: string;
  roleLabel: string | null;
};

export function buildAccountProfileModel(session: ProfileSession): AccountProfileModel {
  const trimmed = session.account.displayName.trim();
  return {
    initial: trimmed ? trimmed.slice(0, 1).toLocaleUpperCase('vi-VN') : '?',
    displayName: session.account.displayName,
    familyName: session.family?.name ?? 'Chưa có nhà',
    roleLabel:
      session.family && session.role
        ? memberRoleLabel({ isOwner: session.family.isOwner, role: session.role })
        : null,
  };
}
