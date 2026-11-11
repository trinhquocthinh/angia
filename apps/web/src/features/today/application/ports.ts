import type { SelfProfile, SelfReminder } from '@angia/contracts';
import type { DoseConfirmationRepository } from '@src/features/doseConfirmations/application/ports';
import type { HealthProfile } from '@src/features/profiles/application/ports';

export type TodayTarget =
  | { kind: 'self'; profile: Pick<SelfProfile, 'id' | 'consentStatus'> }
  | { kind: 'profile'; profile: Pick<HealthProfile, 'id' | 'familyId' | 'consentStatus'> };

export interface TodayRepository extends DoseConfirmationRepository {
  listForSelf(signal?: AbortSignal): Promise<SelfReminder[]>;
}
