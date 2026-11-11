import { useQuery } from '@tanstack/react-query';
import { profileDayRemindersKey } from '@src/features/doseConfirmations/application/profileDayRemindersKey';
import { DOSE_SLOTS } from '@src/features/documents/application/doseSlots';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { selfProfileKey } from '@src/features/selfProfile/application/selfProfileKey';
import { useSelfRecovery } from '@src/features/selfProfile/application/useSelfRecovery';
import { vietnamDate } from '@src/features/visitSummary/application/vietnamDate';
import type { TodayRepository, TodayTarget } from './ports';

// SPEC-079: dùng snapshot lời nhắc, không dựng lại liều từ danh sách thuốc đang dùng.
export function useTodayReminders(
  repository: TodayRepository,
  session: ProfileSession,
  target: TodayTarget | null,
) {
  const date = vietnamDate();
  const enabled = Boolean(
    session.family &&
    target?.profile.consentStatus === 'confirmed' &&
    (target.kind === 'self'
      ? target.profile.id === session.account.healthProfileId
      : session.role === 'main' && target.profile.familyId === session.family.id),
  );
  const queryKey =
    target?.kind === 'self'
      ? [...selfProfileKey(session), 'reminders', date]
      : [...profileDayRemindersKey(session), target?.profile.id ?? null, date];
  const query = useQuery({
    queryKey,
    enabled,
    retry: false,
    queryFn: ({ signal }) => {
      // refetch thủ công cũng phải giữ điều kiện truy cập; API vẫn là nơi kiểm quyền cuối cùng.
      if (!enabled || !target) return Promise.resolve([]);
      return target.kind === 'self'
        ? repository.listForSelf(signal)
        : repository.listForProfile(target.profile.id, signal);
    },
    select: (reminders) =>
      DOSE_SLOTS.flatMap(({ value }) =>
        reminders.filter((reminder) => reminder.date === date && reminder.slot === value),
      ),
  });
  useSelfRecovery(session, enabled ? query.error : null);
  // Query bị tắt vẫn có thể giữ dữ liệu cũ trong cache khi đồng thuận/quyền vừa thay đổi.
  return { ...query, enabled, data: enabled ? query.data : undefined };
}
