import { and, eq, isNull } from 'drizzle-orm';
import { adherencePeriods } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';

// Chỉ đóng giai đoạn còn mở; khóa hồ sơ ở tầng trên bảo đảm dòng vừa đọc chưa bị lệnh khác đổi.
export async function closeAdherencePeriod(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  periodId: string,
  toDate: string,
): Promise<void> {
  const rows = await tx
    .update(adherencePeriods)
    .set({ toDate })
    .where(
      and(
        eq(adherencePeriods.familyId, familyId),
        eq(adherencePeriods.healthProfileId, profileId),
        eq(adherencePeriods.id, periodId),
        isNull(adherencePeriods.toDate),
      ),
    )
    .returning({ id: adherencePeriods.id });
  if (rows.length !== 1) throw new Error('Không đóng được giai đoạn dùng thực tế đang mở');
}
