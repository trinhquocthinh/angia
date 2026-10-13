import { adherencePeriods } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { AdherencePeriod, NewAdherencePeriod } from '../domain/AdherencePeriod.js';
import { adherencePeriodColumns } from './adherencePeriodColumns.js';

export async function insertAdherencePeriod(
  tx: FamilyScopedTx,
  familyId: string,
  input: NewAdherencePeriod,
): Promise<AdherencePeriod> {
  const [row] = await tx
    .insert(adherencePeriods)
    .values({ ...input, familyId })
    .returning(adherencePeriodColumns);
  if (!row) throw new Error('Không ghi được giai đoạn dùng thực tế');
  return row;
}
