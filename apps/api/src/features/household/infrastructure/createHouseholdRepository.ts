import { eq } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { accounts, adminAuditEvents, families } from '@src/shared/db/schema/index.js';
import { createRegistrationGate } from '@src/features/account/infrastructure/createRegistrationGate.js';
import { checkHouseholdCreation } from './checkHouseholdCreation.js';
import { claimFoundingInvitation } from './claimFoundingInvitation.js';
import type {
  CreateHouseholdInput,
  CreateHouseholdOutcome,
  HouseholdRepository,
} from '../application/ports.js';

async function insertHousehold(
  tx: FamilyScopedTx,
  accountId: string,
  name: string,
  claimedInvitation: boolean,
): Promise<CreateHouseholdOutcome> {
  const [family] = await tx
    .insert(families)
    .values({ name, ownerAccountId: accountId })
    .returning({ id: families.id, name: families.name, createdAt: families.createdAt });
  if (!family) throw new Error('INSERT families không trả về nhà');
  await tx
    .update(accounts)
    .set({ familyId: family.id, familyRole: 'main' })
    .where(eq(accounts.id, accountId));
  // CP5.5: nhà mới tự có lượt mặc định; không tạo lượt dùng thử hoặc ghi dòng quota tháng.
  const actions = claimedInvitation ? ['family_created', 'invitation_accepted'] : ['family_created'];
  await tx.insert(adminAuditEvents).values(
    actions.map((action) => ({
      actorAccountId: accountId,
      familyId: family.id,
      targetAccountId: accountId,
      action,
      metadata: {},
    })),
  );
  return { ok: true, family };
}

async function createInTransaction(
  tx: FamilyScopedTx,
  accountId: string,
  input: CreateHouseholdInput,
): Promise<CreateHouseholdOutcome> {
  const failure = await checkHouseholdCreation(tx, accountId);
  if (failure) return failure;
  const open = await createRegistrationGate(tx).isOpen();
  if (!input.invitationToken) {
    if (!open) return { ok: false, code: 'ERR_REGISTRATION_CLOSED' };
    return insertHousehold(tx, accountId, input.name, false);
  }
  const accepted = await claimFoundingInvitation(tx, input.invitationToken, accountId);
  if (!accepted) return { ok: false, code: open ? 'ERR_NOT_FOUND' : 'ERR_REGISTRATION_CLOSED' };
  return insertHousehold(tx, accountId, input.name, true);
}

export function createHouseholdRepository(db: Database): HouseholdRepository {
  return {
    create: (accountId, input) =>
      db.transaction((tx) => createInTransaction(tx, accountId, input), { isolationLevel: 'read committed' }),
  };
}
