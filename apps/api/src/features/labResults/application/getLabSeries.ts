import { consentGate } from '@src/features/profiles/domain/consentGate.js';
import { normalizeName } from '@src/features/prescriptions/domain/normalizeName.js';
import { groupLabSeries, type LabSeriesGroup } from '../domain/groupLabSeries.js';
import type { LabResultRepository } from './ports.js';

type LabSeriesOutcome =
  { ok: true; value: LabSeriesGroup[] } | { ok: false; code: 'ERR_NOT_FOUND' | 'ERR_CONSENT_REQUIRED' };

// SPEC-021: chuỗi biến thiên theo chỉ số; không phân trang (chủ dự án chốt 2026-10-13).
export function getLabSeries(
  repository: LabResultRepository,
  request: { familyId: string; profileId: string; testName?: string | undefined },
): Promise<LabSeriesOutcome> {
  return repository.withFamily(request.familyId, async (store) => {
    const blocked = consentGate(await store.profileConsent(request.profileId));
    if (blocked) return { ok: false, code: blocked };
    const filter = request.testName === undefined ? undefined : normalizeName(request.testName);
    const results = await store.listLabResults(request.profileId, filter);
    return { ok: true, value: groupLabSeries(results) };
  });
}
