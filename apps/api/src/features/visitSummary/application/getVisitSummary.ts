import { showsVitals } from '@angia/contracts';
import type {
  CurrentMedicationCourse,
  MedicationClock,
} from '@src/features/medications/application/managementPorts.js';
import { medicationToday } from '@src/features/medications/application/medicationToday.js';
import { getActiveMedications } from '@src/features/medications/domain/getActiveMedications.js';
import { pickLatestLabResults } from '../domain/pickLatestLabResults.js';
import { resolveSummaryRange } from '../domain/resolveSummaryRange.js';
import { VISIT_SUMMARY_DISCLAIMER, type VisitSummary } from '../domain/VisitSummary.js';
import type { VisitSummaryRepository, VisitSummaryRequest } from './ports.js';

type Outcome =
  | { ok: true; value: VisitSummary<CurrentMedicationCourse> }
  | { ok: false; code: 'ERR_VALIDATION' | 'ERR_NOT_FOUND' | 'ERR_CONSENT_REQUIRED' };

// SPEC-024: thuốc đang dùng tại ngày tạo (SPEC-018), số đo và giai đoạn dùng thuốc trong [from, to],
// xét nghiệm mới nhất từng chỉ số tới ngày to; chỉ dữ liệu đã duyệt, kèm dòng miễn trừ (BR-034, BR-035).
export function getVisitSummary(
  repository: VisitSummaryRepository,
  request: VisitSummaryRequest,
  now: MedicationClock,
): Promise<Outcome> {
  const createdAt = now();
  const today = medicationToday(() => createdAt);
  const range = resolveSummaryRange(today, { from: request.from, to: request.to });
  if (!range.ok) return Promise.resolve(range);
  const { from, to } = range.value;
  return repository.withFamily(request.familyId, async (store) => {
    const found = await store.findProfile(request.profileId);
    if (!found) return { ok: false, code: 'ERR_NOT_FOUND' };
    if (found.consentStatus !== 'confirmed') return { ok: false, code: 'ERR_CONSENT_REQUIRED' };
    const includeVitals = showsVitals(found, Number(today.slice(0, 4)));
    const profile = { id: found.id, displayName: found.displayName, birthYear: found.birthYear };
    const profileId = profile.id;
    return {
      ok: true,
      value: {
        profile,
        createdAt,
        from,
        to,
        showsVitals: includeVitals,
        currentMedications: getActiveMedications(await store.findMedicationHistory(profileId), today),
        measurements: includeVitals ? await store.listMeasurementsBetween(profileId, from, to) : [],
        latestLabResults: pickLatestLabResults(await store.listLabResults(profileId), to),
        adherencePeriods: await store.listAdherencePeriodsBetween(profileId, from, to),
        disclaimer: VISIT_SUMMARY_DISCLAIMER,
      },
    };
  });
}
