import type { DoseSlotList } from '@angia/contracts';

// Body PUT: chỉ buổi có giờ (exactOptionalPropertyTypes của client sinh không nhận undefined).
export type DoseSlotTimes = Partial<Record<'morning' | 'noon' | 'afternoon' | 'evening', string>>;

export interface DoseSlotRepository {
  /** SPEC-025: khung giờ đã lưu, rỗng khi chưa thiết lập. */
  get(profileId: string, signal?: AbortSignal): Promise<DoseSlotList>;
  /** Thay toàn bộ cấu hình; buổi không gửi bị bỏ khung giờ. */
  save(profileId: string, slots: DoseSlotTimes, csrfToken: string): Promise<DoseSlotList>;
}
