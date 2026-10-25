import { healthProfileSchema } from '@angia/contracts';
import { describe, expect, it } from 'vitest';
import type { HealthProfile } from '../domain/HealthProfile.js';
import { toProfileResponse } from './toProfileResponse.js';

const profile: HealthProfile = {
  id: '3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b',
  familyId: '4f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b',
  displayName: 'Mẹ',
  birthYear: 1950,
  consentConfirmedAt: null,
  consentConfirmedBy: null,
  consentBasis: null,
  consentStatus: 'withdrawn',
  consentSource: null,
  consentRespondentName: null,
  consentWithdrawnAt: new Date('2026-10-24T03:00:00Z'),
  consentWithdrawnBy: '5f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b',
  createdAt: new Date('2026-10-01T00:00:00Z'),
};

describe('TC-389 — phản hồi hồ sơ khớp đúng hợp đồng', () => {
  it('không lộ consentWithdrawnAt/consentWithdrawnBy và chỉ có đúng các trường của schema', () => {
    const response = toProfileResponse(profile);
    expect(response).not.toHaveProperty('consentWithdrawnAt');
    expect(response).not.toHaveProperty('consentWithdrawnBy');
    expect(Object.keys(response).sort()).toEqual(Object.keys(healthProfileSchema.shape).sort());
  });
});
