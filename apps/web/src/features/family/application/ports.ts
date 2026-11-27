import type { paths, components } from '@src/shared/api/schema.gen';

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

export type RegistrationSwitch = components['schemas']['RegistrationSwitchResponse'];
export type FoundingInvitation =
  paths['/api/admin/founding-invitations']['post']['responses'][201]['content']['application/json'];
export interface RegistrationSwitchRepository {
  get(signal?: AbortSignal): Promise<RegistrationSwitch>;
  set(open: boolean, csrfToken: string): Promise<RegistrationSwitch>;
}
export interface FoundingInvitationRepository {
  create(csrfToken: string): Promise<FoundingInvitation>;
  revoke(id: string, csrfToken: string): Promise<void>;
}

export type AdminAuditAction = components['schemas']['AdminAuditAction'];
export type AdminAuditEvent = components['schemas']['AdminAuditEvent'];
export type AdminAuditResponse = components['schemas']['AdminAuditResponse'];
export type AdminStatsWeek = components['schemas']['AdminStatsWeek'];
export type AdminStatsResponse = components['schemas']['AdminStatsResponse'];
export type AdminAuditQuery = NonNullable<paths['/api/admin/audit-events']['get']['parameters']['query']>;
export interface AdminAuditRepository {
  list(query: AdminAuditQuery, signal?: AbortSignal): Promise<AdminAuditResponse>;
}
export interface AdminStatsRepository {
  get(signal?: AbortSignal): Promise<AdminStatsResponse>;
}
