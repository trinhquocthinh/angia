import { canManageProfileGuardians } from '@src/features/profiles/application/canManageProfileGuardians';
import type { ProfileListItem, ProfileSession } from '@src/features/profiles/application/ports';
import { createDoseSlotRepository } from '../infrastructure/createDoseSlotRepository';
import { useReminderSetting } from '../application/useReminderSetting';
import { DoseSlotSettingsForm } from './DoseSlotSettingsForm';
import { MinorReminderRecipientsNotice } from './MinorReminderRecipientsNotice';
import { ReminderDeviceLink } from './ReminderDeviceLink';
import { ReminderRecipientsSection } from './ReminderRecipientsSection';
import { ReminderSettingSection } from './ReminderSettingSection';
import { ReminderSettingsHeader } from './ReminderSettingsHeader';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import '@src/shared/styles/reminders.css';

const doseSlots = createDoseSlotRepository();
const doseSlotIo = { load: doseSlots.get, store: doseSlots.save };

export function ReminderSettings({
  profile,
  session,
}: {
  profile: ProfileListItem;
  session: ProfileSession;
}) {
  const slots = useReminderSetting('dose-slots', doseSlotIo, session, profile);
  const showGuardians = canManageProfileGuardians(profile, session);
  const activeSlotCount = slots.query.data ? slots.query.data.length : null;
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 pb-6 lg:gap-6">
      <ReminderSettingsHeader
        profileId={profile.id}
        displayName={profile.displayName}
        activeSlotCount={activeSlotCount}
      />
      {profile.consentStatus !== 'confirmed' ? (
        <div className="reminder-card flex items-start gap-3 p-6 text-body text-text-secondary">
          <span className="reminder-section-tile text-warning" aria-hidden="true">
            <AdminIcon name="info" size={22} />
          </span>
          <p role="alert" className="self-center font-medium text-text-primary">
            Hồ sơ chưa được đồng ý lưu dữ liệu.
          </p>
        </div>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-6">
          <ReminderSettingSection
            title="Khung giờ nhắc"
            subtitle="4 buổi trong ngày · Giờ Việt Nam"
            icon="notifications"
            badge={activeSlotCount !== null ? `${activeSlotCount}/4 buổi` : undefined}
            query={slots.query}
            loadingText="Đang tải khung giờ nhắc…"
          >
            {(saved) => (
              <DoseSlotSettingsForm
                saved={saved}
                pending={slots.save.isPending}
                serverError={slots.save.error?.message ?? null}
                done={slots.save.isSuccess}
                onSubmit={(value) => slots.save.mutate(value)}
              />
            )}
          </ReminderSettingSection>
          <div className="flex min-w-0 flex-col gap-5 lg:gap-6">
            {showGuardians ? (
              <MinorReminderRecipientsNotice profileId={profile.id} />
            ) : (
              <ReminderRecipientsSection profile={profile} session={session} />
            )}
            <ReminderDeviceLink />
          </div>
        </div>
      )}
    </div>
  );
}
