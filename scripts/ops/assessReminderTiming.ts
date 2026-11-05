import type { DeliveryRow, ReminderRow, ReminderAuditKind } from './readReminderRows.js';
import { summarizeDurations, type DurationSummary } from './summarizeDurations.js';

/** TC-096/NFR-6: ≥ 99% lượt gửi được push service tiếp nhận trong ±5 phút so với giờ dự kiến, 7 ngày liên tục. */
export const TOLERANCE_MS = 5 * 60_000;
export const REQUIRED_RATIO = 0.99;
export const REQUIRED_DAYS = 7;

interface DaySummary {
  date: string;
  reminders: number;
  eligible: number;
  onTime: number;
}

interface ProfileSummary {
  profileId: string;
  reminders: number;
  days: number;
}

export interface ReminderTimingVerdict {
  byKind: { kind: ReminderAuditKind; eligible: number; onTime: number }[];
  passed: boolean;
  reasons: string[];
  /** Lượt gửi tính vào mẫu số: mọi đích thiết bị trừ `revoked` (người nhận không còn hợp lệ, đúng là không gửi). */
  eligible: number;
  onTime: number;
  duplicateSlots: number;
  remindersWithoutDevices: number;
  statuses: Record<string, number>;
  failedByCode: Record<string, number>;
  /** accepted_at − scheduled_at của lượt `accepted`: lúc push service nhận, không phải lúc thiết bị hiện. */
  acceptLag: DurationSummary;
  /** sent_at − scheduled_at: lúc bộ gửi chốt đích (fan-out). */
  fanOutLag: DurationSummary;
  days: DaySummary[];
  profiles: ProfileSummary[];
}

const increment = (counts: Record<string, number>, key: string) => {
  counts[key] = (counts[key] ?? 0) + 1;
};

const isOnTime = (delivery: DeliveryRow, reminder: ReminderRow | undefined) =>
  delivery.status === 'accepted' &&
  delivery.acceptedAt !== null &&
  reminder !== undefined &&
  Math.abs(delivery.acceptedAt.getTime() - reminder.scheduledAt.getTime()) <= TOLERANCE_MS;

const countDuplicateSlots = (reminders: readonly ReminderRow[]) => {
  const counts: Record<string, number> = {};
  for (const r of reminders) increment(counts, `${r.kind}|${r.profileId}|${r.date}|${r.slot}`);
  return Object.values(counts).filter((count) => count > 1).length;
};

const summarizeProfiles = (reminders: readonly ReminderRow[]): ProfileSummary[] => {
  const byProfile = new Map<string, ReminderRow[]>();
  for (const r of reminders) byProfile.set(r.profileId, [...(byProfile.get(r.profileId) ?? []), r]);
  return [...byProfile].map(([profileId, rows]) => ({
    profileId,
    reminders: rows.length,
    days: new Set(rows.map((row) => row.date)).size,
  }));
};

const verdictReasons = (eligible: number, onTime: number, duplicateSlots: number, dayCount: number) => {
  const reasons: string[] = [];
  if (dayCount < REQUIRED_DAYS) reasons.push(`Mới có ${dayCount}/${REQUIRED_DAYS} ngày có lời nhắc`);
  if (duplicateSlots > 0) reasons.push(`Có ${duplicateSlots} bộ hồ sơ/ngày/buổi bị trùng lời nhắc`);
  if (eligible === 0) reasons.push('Chưa có lượt gửi thiết bị nào để đo');
  else if (onTime / eligible < REQUIRED_RATIO)
    reasons.push(`Tỷ lệ đúng giờ ${((onTime / eligible) * 100).toFixed(1)}% < ${REQUIRED_RATIO * 100}%`);
  return reasons;
};

// Chủ dự án duyệt 2026-10-25: đo theo từng thiết bị bằng accepted_at; gone/failed/expired/pending là trượt.
export function assessReminderTiming(
  reminders: readonly ReminderRow[],
  deliveries: readonly DeliveryRow[],
): ReminderTimingVerdict {
  const byId = new Map(reminders.map((r) => [`${r.kind}|${r.reminderId}`, r]));
  const days = new Map<string, DaySummary>();
  for (const r of reminders) {
    const day = days.get(r.date) ?? { date: r.date, reminders: 0, eligible: 0, onTime: 0 };
    days.set(r.date, { ...day, reminders: day.reminders + 1 });
  }
  const statuses: Record<string, number> = {};
  const failedByCode: Record<string, number> = {};
  const acceptLags: number[] = [];
  const byKind = (['medication', 'revisit'] as const).map((kind) => ({ kind, eligible: 0, onTime: 0 }));
  let eligible = 0;
  let onTime = 0;
  for (const d of deliveries) {
    increment(statuses, d.status);
    if (d.status === 'failed') increment(failedByCode, d.lastError ?? 'unknown');
    const reminder = byId.get(`${d.kind}|${d.reminderId}`);
    if (d.status === 'accepted' && d.acceptedAt && reminder)
      acceptLags.push(d.acceptedAt.getTime() - reminder.scheduledAt.getTime());
    if (d.status === 'revoked') continue;
    const hit = isOnTime(d, reminder);
    eligible += 1;
    onTime += hit ? 1 : 0;
    const group = byKind.find((g) => g.kind === d.kind)!;
    group.eligible += 1;
    group.onTime += hit ? 1 : 0;
    const day = reminder && days.get(reminder.date);
    if (day) Object.assign(day, { eligible: day.eligible + 1, onTime: day.onTime + (hit ? 1 : 0) });
  }
  const withDevices = new Set(deliveries.map((d) => `${d.kind}|${d.reminderId}`));
  const duplicateSlots = countDuplicateSlots(reminders);
  const reasons = verdictReasons(eligible, onTime, duplicateSlots, days.size);
  for (const group of byKind) {
    if (group.eligible > 0 && group.onTime / group.eligible < REQUIRED_RATIO)
      reasons.push(
        `Loại ${group.kind}: tỷ lệ đúng giờ ${((group.onTime / group.eligible) * 100).toFixed(1)}% < ${REQUIRED_RATIO * 100}%`,
      );
  }
  return {
    byKind,
    passed: reasons.length === 0,
    reasons,
    eligible,
    onTime,
    duplicateSlots,
    remindersWithoutDevices: reminders.filter((r) => !withDevices.has(`${r.kind}|${r.reminderId}`)).length,
    statuses,
    failedByCode,
    acceptLag: summarizeDurations(acceptLags),
    fanOutLag: summarizeDurations(
      reminders.flatMap((r) => (r.sentAt ? [r.sentAt.getTime() - r.scheduledAt.getTime()] : [])),
    ),
    days: [...days.values()].sort((a, b) => a.date.localeCompare(b.date)),
    profiles: summarizeProfiles(reminders),
  };
}
