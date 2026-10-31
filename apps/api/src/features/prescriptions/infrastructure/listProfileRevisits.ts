import { and, asc, eq, gte } from 'drizzle-orm';
import type { RevisitList } from '@angia/contracts';
import { prescriptions } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';

export async function listProfileRevisits(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  from: string,
): Promise<RevisitList> {
  const rows = await tx
    .select({
      id: prescriptions.id,
      issuedDate: prescriptions.issuedDate,
      facility: prescriptions.facility,
      revisitDate: prescriptions.revisitDate,
    })
    .from(prescriptions)
    .where(
      and(
        eq(prescriptions.familyId, familyId),
        eq(prescriptions.healthProfileId, profileId),
        gte(prescriptions.revisitDate, from),
      ),
    )
    .orderBy(asc(prescriptions.revisitDate), asc(prescriptions.issuedDate), asc(prescriptions.id));
  const groups = new Map<string, RevisitList[number]>();
  for (const { revisitDate, ...prescription } of rows) {
    if (!revisitDate) continue;
    let group = groups.get(revisitDate);
    if (!group) {
      group = { revisitDate, prescriptions: [] };
      groups.set(revisitDate, group);
    }
    group.prescriptions.push(prescription);
  }
  return [...groups.values()];
}
