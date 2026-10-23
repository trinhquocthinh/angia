import type { DoseSlotRepository, ReadDoseSlotOutcome } from './ports.js';

// SPEC-025: đọc khung giờ đã lưu; danh sách rỗng nghĩa là hồ sơ chưa thiết lập khung giờ nhắc.
export function getDoseSlots(
  repository: DoseSlotRepository,
  familyId: string,
  profileId: string,
): Promise<ReadDoseSlotOutcome> {
  return repository.withFamily(familyId, async (store) => {
    if (!(await store.findProfile(profileId))) return { ok: false, code: 'ERR_NOT_FOUND' };
    return { ok: true, value: await store.listSlots(profileId) };
  });
}
