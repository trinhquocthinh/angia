import type { DoseSlotRepository } from '@src/features/reminders/application/ports.js';
import { DAILY_SLOTS, type DoseSlotTime } from '@src/features/reminders/domain/DoseSlotConfig.js';

type MemoryProfile = { id: string; familyId: string; consentStatus: string };
type StoredSlot = DoseSlotTime & { familyId: string; profileId: string };

// Mô phỏng giao dịch: ghi trên bản sao, chỉ thay dữ liệu đã commit khi work thành công.
export function createMemoryDoseSlotRepository(
  profiles: MemoryProfile[] = [{ id: 'me', familyId: 'family-a', consentStatus: 'confirmed' }],
) {
  const state = { slots: [] as StoredSlot[] };
  const repository: DoseSlotRepository = {
    withFamily: async (familyId, work) => {
      let draft = state.slots.map((s) => ({ ...s }));
      const result = await work({
        findProfile: async (id) => profiles.find((p) => p.id === id && p.familyId === familyId) ?? null,
        replaceSlots: async (profileId, slots) => {
          draft = draft
            .filter((s) => !(s.familyId === familyId && s.profileId === profileId))
            .concat(slots.map((s) => ({ ...s, familyId, profileId })));
        },
        listSlots: async (profileId) =>
          draft
            .filter((s) => s.familyId === familyId && s.profileId === profileId)
            .sort((a, b) => DAILY_SLOTS.indexOf(a.slot) - DAILY_SLOTS.indexOf(b.slot))
            .map(({ slot, time }) => ({ slot, time })),
      });
      state.slots = draft;
      return result;
    },
  };
  return { repository, state };
}
