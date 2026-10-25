// BR-036: khung giờ buổi của hồ sơ (DoseSlot). Giờ dạng "HH:mm" theo giờ Việt Nam.
export const DAILY_SLOTS = ['morning', 'noon', 'afternoon', 'evening'] as const;
export type DailySlot = (typeof DAILY_SLOTS)[number];
export type DoseSlotTimes = { [slot in DailySlot]?: string | undefined };
export interface DoseSlotTime {
  slot: DailySlot;
  time: string;
}
