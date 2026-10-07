import type { components } from '@src/shared/api/schema.gen';

export type Family = components['schemas']['Family'];
export type Account = components['schemas']['Account'];
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
