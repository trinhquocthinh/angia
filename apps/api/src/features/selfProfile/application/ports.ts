import type { SelfReminder } from '@angia/contracts';
import type { LabResultRepository } from '@src/features/labResults/application/ports.js';
import type { MeasurementRepository } from '@src/features/measurements/application/ports.js';
import type { MedicationManagementRepository } from '@src/features/medications/application/managementPorts.js';
import type { StoredReminderMedication } from '@src/features/myReminders/application/ports.js';
import type { RevisitRepository } from '@src/features/prescriptions/application/revisitPorts.js';
import type { ConsentStatus } from '@src/features/profiles/domain/HealthProfile.js';
import type { TimelineRepository } from '@src/features/timeline/application/ports.js';

export interface SelfProfileRow {
  id: string;
  displayName: string;
  birthYear: number | null;
  consentStatus: ConsentStatus;
  vitalsEnabled: boolean | null;
}
export type StoredSelfReminder = Omit<SelfReminder, 'medications'> & {
  medications: StoredReminderMedication[];
};
interface SelfProfileStore {
  /** null = hồ sơ không thấy được trong phạm vi tự xem của gia đình phiên. */
  profile(): Promise<SelfProfileRow | null>;
  reminders(date: string): Promise<StoredSelfReminder[]>;
}
/** Mọi repository của một hồ sơ đều chạy trong withSelfScope, gồm repository đọc dùng lại của route main. */
export interface SelfProfileScope {
  withFamily<T>(familyId: string, work: (store: SelfProfileStore) => Promise<T>): Promise<T>;
  measurements: MeasurementRepository;
  labResults: LabResultRepository;
  medications: MedicationManagementRepository;
  revisits: RevisitRepository;
  timeline: TimelineRepository;
}
export interface SelfProfileRepository {
  /** profileId lấy từ accounts.health_profile_id của phiên, không bao giờ từ request. */
  forProfile(profileId: string): SelfProfileScope;
}
