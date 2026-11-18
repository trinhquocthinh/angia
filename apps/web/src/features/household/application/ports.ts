import type { components } from '@src/shared/api/schema.gen';

export type HouseholdRequest = components['schemas']['CreateHouseholdRequest'];
export type HouseholdResult = { ok: true } | { ok: false; code: string };
export type SubmitHousehold = (body: HouseholdRequest, csrfToken: string) => Promise<HouseholdResult>;
