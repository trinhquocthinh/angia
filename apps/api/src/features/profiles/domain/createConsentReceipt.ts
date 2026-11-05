import type { ConsentConfirmation } from './ConsentConfirmation.js';
import type { ConsentReceipt } from './ConsentReceipt.js';
import type { ProfileOutcome } from './HealthProfile.js';

// LG-02: không tin tên tài khoản/tên cam kết chưa chuẩn hóa khi đi vào use case.
export function createConsentReceipt(
  consent: ConsentConfirmation | undefined,
  linkedAccountId: string | null,
  actor: { id: string; displayName: string | null },
  at: Date,
): ProfileOutcome<ConsentReceipt | null, 'ERR_VALIDATION'> {
  if (consent === undefined) return { ok: true, value: null };
  if (
    (consent.kind === 'attestation' &&
      (linkedAccountId !== null ||
        consent.attestation !== true ||
        !['self', 'guardian'].includes(consent.basis))) ||
    (consent.kind === 'self' && linkedAccountId !== actor.id) ||
    !['attestation', 'self'].includes(consent.kind)
  )
    return { ok: false, code: 'ERR_VALIDATION' };
  const name = consent.kind === 'self' ? actor.displayName : consent.respondentName;
  const normalized = name?.trim().normalize('NFC') ?? '';
  if (!normalized || normalized.length > 60) return { ok: false, code: 'ERR_VALIDATION' };
  return {
    ok: true,
    value: {
      consentStatus: 'confirmed',
      consentSource: consent.kind === 'self' ? 'self' : 'main_attested',
      consentConfirmedAt: at,
      consentConfirmedBy: actor.id,
      consentBasis: consent.kind === 'self' ? 'self' : consent.basis,
      consentRespondentName: normalized,
    },
  };
}
