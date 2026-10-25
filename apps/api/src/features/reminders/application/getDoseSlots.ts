import { consentGate } from '@src/features/profiles/domain/consentGate.js';
import type { DoseSlotRepository, ReadDoseSlotOutcome } from './ports.js';

// SPEC-025: đọc khung giờ đã lưu; danh sách rỗng nghĩa là hồ sơ chưa thiết lập khung giờ nhắc.
export function getDoseSlots(
  repository: DoseSlotRepository,
  familyId: string,
  profileId: string,
): Promise<ReadDoseSlotOutcome> {
  return repository.withFamily(familyId, async (store) => {
    const blocked = consentGate((await store.findProfile(profileId))?.consentStatus ?? null);
    if (blocked) return { ok: false, code: blocked };
    return { ok: true, value: await store.listSlots(profileId) };
  });
}
