import type {
  CurrentMedications,
  LabSeries,
  MeasurementSeries,
  RevisitList,
  SelfProfile,
  SelfReminder,
  TimelinePage,
} from '@angia/contracts';
import type { MeasurementKind } from '@src/features/measurements/application/ports';

// SPEC-042: mọi route lấy hồ sơ từ phiên nên không có tham số id hồ sơ.
export interface SelfProfileRepository {
  profile(signal?: AbortSignal): Promise<SelfProfile>;
  medications(signal?: AbortSignal): Promise<CurrentMedications>;
  reminders(signal?: AbortSignal): Promise<SelfReminder[]>;
  revisits(signal?: AbortSignal): Promise<RevisitList>;
  timeline(cursor: string | null, signal?: AbortSignal): Promise<TimelinePage>;
  measurementSeries(
    kind: MeasurementKind,
    range: { from: string; to: string },
    signal?: AbortSignal,
  ): Promise<MeasurementSeries>;
  labSeries(signal?: AbortSignal): Promise<LabSeries[]>;
}
