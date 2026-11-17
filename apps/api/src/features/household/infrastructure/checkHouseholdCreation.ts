import { eq } from 'drizzle-orm';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { accounts } from '@src/shared/db/schema/index.js';
import { readLegalRequirements } from '@src/features/legal/infrastructure/readLegalRequirements.js';
import { isLegalAcceptanceSatisfied } from '@src/features/legal/domain/isLegalAcceptanceSatisfied.js';
type Failure = {
  ok: false;
  code: 'ERR_UNAUTHENTICATED' | 'ERR_ACCOUNT_ALREADY_IN_FAMILY' | 'ERR_LEGAL_ACCEPTANCE_REQUIRED';
};

// Kiểm lại DB dưới khoá, không dùng family/role trong request hoặc snapshot phiên.
export async function checkHouseholdCreation(tx: FamilyScopedTx, accountId: string): Promise<Failure | null> {
  const [account] = await tx
    .select({ familyId: accounts.familyId, lockedAt: accounts.lockedAt })
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .for('update');
  if (!account || account.lockedAt) return { ok: false, code: 'ERR_UNAUTHENTICATED' };
  if (account.familyId !== null) return { ok: false, code: 'ERR_ACCOUNT_ALREADY_IN_FAMILY' };
  const requirements = await readLegalRequirements(tx, accountId, new Date());
  if (!isLegalAcceptanceSatisfied(requirements)) return { ok: false, code: 'ERR_LEGAL_ACCEPTANCE_REQUIRED' };
  return null;
}
