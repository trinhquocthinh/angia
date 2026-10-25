import type { ConsentStatus } from './HealthProfile.js';

// Cổng đồng thuận dùng chung (BR-009): null = hồ sơ không tồn tại trong phạm vi gia đình.
export function consentGate(status: ConsentStatus | null): 'ERR_NOT_FOUND' | 'ERR_CONSENT_REQUIRED' | null {
  if (status === null) return 'ERR_NOT_FOUND';
  return status === 'confirmed' ? null : 'ERR_CONSENT_REQUIRED';
}
