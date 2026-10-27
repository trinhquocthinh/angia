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

// SPEC-013: trần ngân sách AI toàn hệ thống của tháng hiện tại (giờ Việt Nam).
export interface AiBudgetRepository {
  get(signal?: AbortSignal): Promise<AiBudget>;
  setCap(monthlyCapUsd: number, csrfToken: string): Promise<AiBudget>;
}
