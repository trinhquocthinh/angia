import { medicationToday } from '@src/features/medications/application/medicationToday.js';
import { normalizeName } from '@src/features/prescriptions/domain/normalizeName.js';
import { planAdherencePeriod } from '../domain/planAdherencePeriod.js';
import type {
  AdherenceClock,
  AdherenceRepository,
  RecordAdherenceOutcome,
  RecordAdherenceRequest,
} from './ports.js';

// SPEC-022/BR-032: đóng giai đoạn trước và mở giai đoạn mới trong cùng giao dịch; khóa theo hồ sơ
// để hai lệnh đồng thời không cùng đọc một giai đoạn mở (exclusion constraint là lớp chặn cuối).
export function recordAdherencePeriod(
  repository: AdherenceRepository,
  request: RecordAdherenceRequest,
  now: AdherenceClock,
): Promise<RecordAdherenceOutcome> {
  return repository.withFamily(request.familyId, async (store) => {
    const profile = await store.findProfile(request.profileId);
    if (!profile) return { ok: false, code: 'ERR_NOT_FOUND' };
    if (profile.consentStatus !== 'confirmed') return { ok: false, code: 'ERR_CONSENT_REQUIRED' };
    await store.lockAdherenceProfile(request.profileId);
    const medicationNameNormalized = normalizeName(request.medicationName);
    const latest = await store.findLatestPeriod(request.profileId, medicationNameNormalized);
    const plan = planAdherencePeriod(latest, request.status, request.fromDate, medicationToday(now));
    if (!plan.ok) return plan;
    if (latest && plan.closeToDate) await store.closePeriod(request.profileId, latest.id, plan.closeToDate);
    const period = await store.insertPeriod({
      healthProfileId: request.profileId,
      medicationName: request.medicationName.trim(),
      medicationNameNormalized,
      status: request.status,
      fromDate: request.fromDate,
      recordedBy: request.accountId,
    });
    return { ok: true, value: period };
  });
}
