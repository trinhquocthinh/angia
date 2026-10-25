import { and, eq } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import { healthProfiles } from '@src/shared/db/schema/index.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { MyConsentRepository } from '../application/ports.js';

// SPEC-036: mọi truy vấn trong withFamilyScope (RLS) và lọc family_id tường minh.
export function createMyConsentRepository(db: Database): MyConsentRepository {
  return {
    withFamily: (familyId, work) =>
      withFamilyScope(db, familyId, (tx) => {
        const ofProfile = (id: string) =>
          and(eq(healthProfiles.id, id), eq(healthProfiles.familyId, familyId));
        const columns = {
          id: healthProfiles.id,
          displayName: healthProfiles.displayName,
          consentStatus: healthProfiles.consentStatus,
        };
        return work({
          readProfile: async (id) =>
            (
              await tx
                .select({ ...columns, withdrawnAt: healthProfiles.consentWithdrawnAt })
                .from(healthProfiles)
                .where(ofProfile(id))
            )[0] ?? null,
          lockProfile: async (id) =>
            (await tx.select(columns).from(healthProfiles).where(ofProfile(id)).for('update'))[0] ?? null,
          markWithdrawn: async (id, accountId, at) => {
            await tx
              .update(healthProfiles)
              .set({ consentStatus: 'withdrawn', consentWithdrawnAt: at, consentWithdrawnBy: accountId })
              .where(ofProfile(id));
          },
        });
      }),
  };
}
