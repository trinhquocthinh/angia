import type { CreateHouseholdInput, CreateHouseholdOutcome, HouseholdRepository } from './ports.js';

export function createHousehold(
  repository: HouseholdRepository,
  accountId: string,
  input: CreateHouseholdInput,
): Promise<CreateHouseholdOutcome> {
  return repository.create(accountId, input);
}
