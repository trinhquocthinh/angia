import type { HealthProfile } from '@src/features/profiles/application/ports';

export type PainProfileContext = Pick<HealthProfile, 'id' | 'familyId' | 'consentStatus'>;
