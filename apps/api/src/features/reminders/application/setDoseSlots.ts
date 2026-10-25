import { planDoseSlots } from '../domain/planDoseSlots.js';
import type { DoseSlotOutcome, DoseSlotRepository, SetDoseSlotsRequest } from './ports.js';

// SPEC-025/BR-036: thay toàn bộ khung giờ buổi của hồ sơ trong một giao dịch; thứ tự sai thì không ghi.
export function setDoseSlots(
  repository: DoseSlotRepository,
  request: SetDoseSlotsRequest,
): Promise<DoseSlotOutcome> {
  return repository.withFamily(request.familyId, async (store) => {
    const profile = await store.findProfile(request.profileId);
    if (!profile) return { ok: false, code: 'ERR_NOT_FOUND' };
    if (profile.consentStatus !== 'confirmed') return { ok: false, code: 'ERR_CONSENT_REQUIRED' };
    const plan = planDoseSlots(request.slots);
    if (!plan.ok) return plan;
    await store.replaceSlots(request.profileId, plan.value);
    return plan;
  });
}
