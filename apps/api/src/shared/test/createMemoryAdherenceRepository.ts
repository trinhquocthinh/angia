import type { AdherenceRepository } from '@src/features/adherence/application/ports.js';
import type { AdherencePeriod } from '@src/features/adherence/domain/AdherencePeriod.js';

type MemoryProfile = { id: string; familyId: string; consentStatus: string };
type StoredPeriod = AdherencePeriod & { familyId: string; recordedBy: string };

// Mô phỏng giao dịch: ghi trên bản sao, chỉ thay dữ liệu đã commit khi work thành công.
export function createMemoryAdherenceRepository(
  profiles: MemoryProfile[] = [{ id: 'me', familyId: 'family-a', consentStatus: 'confirmed' }],
) {
  const state = { periods: [] as StoredPeriod[] };
  let sequence = 0;
  const repository: AdherenceRepository = {
    withFamily: async (familyId, work) => {
      let draft = state.periods.map((p) => ({ ...p }));
      const own = (profileId: string) =>
        draft.filter((p) => p.familyId === familyId && p.healthProfileId === profileId);
      const result = await work({
        findProfile: async (id) => profiles.find((p) => p.id === id && p.familyId === familyId) ?? null,
        lockAdherenceProfile: async () => undefined,
        findLatestPeriod: async (profileId, name) =>
          own(profileId)
            .filter((p) => p.medicationNameNormalized === name)
            .sort((a, b) => b.fromDate.localeCompare(a.fromDate))[0] ?? null,
        closePeriod: async (profileId, periodId, toDate) => {
          draft = draft.map((p) =>
            p.id === periodId && p.healthProfileId === profileId && p.familyId === familyId
              ? { ...p, toDate }
              : p,
          );
        },
        insertPeriod: async (input) => {
          const period = { ...input, id: `period-${++sequence}`, toDate: null, familyId };
          draft.push(period);
          return period;
        },
        listPeriods: async (profileId) =>
          own(profileId).sort(
            (a, b) =>
              a.medicationNameNormalized.localeCompare(b.medicationNameNormalized) ||
              a.fromDate.localeCompare(b.fromDate),
          ),
      });
      state.periods = draft;
      return result;
    },
  };
  return { repository, state };
}
