import { findProfileInFamily } from '@src/features/profiles/infrastructure/findProfileInFamily.js';
import { and, eq, sql } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import { doseSlots } from '@src/shared/db/schema/index.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { DoseSlotRepository } from '../application/ports.js';
import type { DailySlot } from '../domain/DoseSlotConfig.js';

const slotOrder = sql`array_position(ARRAY['morning','noon','afternoon','evening'], ${doseSlots.slot})`;

// RLS qua withFamilyScope; điều kiện family_id bổ sung phòng thủ theo chiều sâu. Khóa dòng hồ sơ
// (FOR UPDATE) tuần tự hóa hai lệnh lưu đồng thời để lệnh xóa-rồi-ghi không đụng khóa chính.
export function createDoseSlotRepository(db: Database): DoseSlotRepository {
  return {
    withFamily: (familyId, work) =>
      withFamilyScope(db, familyId, (tx) =>
        work({
          findProfile: (id) => findProfileInFamily(tx, familyId, id, 'update'),
          replaceSlots: async (profileId, slots) => {
            await tx
              .delete(doseSlots)
              .where(and(eq(doseSlots.healthProfileId, profileId), eq(doseSlots.familyId, familyId)));
            if (slots.length === 0) return;
            await tx
              .insert(doseSlots)
              .values(
                slots.map((s) => ({ healthProfileId: profileId, familyId, slot: s.slot, timeOfDay: s.time })),
              );
          },
          listSlots: async (profileId) =>
            (
              await tx
                .select({
                  slot: doseSlots.slot,
                  time: sql<string>`to_char(${doseSlots.timeOfDay}, 'HH24:MI')`,
                })
                .from(doseSlots)
                .where(and(eq(doseSlots.healthProfileId, profileId), eq(doseSlots.familyId, familyId)))
                .orderBy(slotOrder)
            ).map((row) => ({ slot: row.slot as DailySlot, time: row.time })),
        }),
      ),
  };
}
