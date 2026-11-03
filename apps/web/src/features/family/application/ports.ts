import type { components } from '@src/shared/api/schema.gen';

export type Family = components['schemas']['Family'];
export type Account = components['schemas']['Account'];
export type AiBudget = components['schemas']['SpendResponse'];
export type FamilyRole = NonNullable<Account['role']>;
export type AdminCommand =
  | { type: 'create'; name: string }
  | { type: 'assign'; accountId: string; familyId: string; role: FamilyRole }
  | { type: 'role'; accountId: string; role: FamilyRole }
  | { type: 'remove'; accountId: string };

export interface AdminRepository {
  listFamilies(signal?: AbortSignal): Promise<Family[]>;
  listAccounts(signal?: AbortSignal): Promise<Account[]>;
  createFamily(name: string, csrfToken: string): Promise<Family>;
  assign(accountId: string, familyId: string, role: FamilyRole, csrfToken: string): Promise<Account>;
  change(
    accountId: string,
    body: components['schemas']['ChangeMembershipRequest'],
    csrfToken: string,
  ): Promise<Account>;
}

// SPEC-050: quản trị chỉ thấy id và tên hồ sơ/tài khoản (ngoại lệ hẹp BR-003).
export type AdminProfileLink = components['schemas']['AdminProfileLink'];
export interface ProfileLinkAdminRepository {
  list(familyId: string, signal?: AbortSignal): Promise<AdminProfileLink[]>;
  setLinkedAccount(
    familyId: string,
    profileId: string,
    accountId: string | null,
    csrfToken: string,
  ): Promise<AdminProfileLink>;
}

// SPEC-013: trần ngân sách AI toàn hệ thống của tháng hiện tại (giờ Việt Nam).
export interface AiBudgetRepository {
  get(signal?: AbortSignal): Promise<AiBudget>;
  setCap(monthlyCapUsd: number, csrfToken: string): Promise<AiBudget>;
}
