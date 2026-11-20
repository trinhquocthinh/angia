import { createReminderRecipientRepository } from '../infrastructure/createReminderRecipientRepository';
import { ReminderRecipientsForm } from './ReminderRecipientsForm';
import type { ProfileListItem, ProfileSession } from '@src/features/profiles/application/ports';
import { useReminderSetting } from '../application/useReminderSetting';
import { ReminderSettingSection } from './ReminderSettingSection';

const recipients = createReminderRecipientRepository();
const recipientIo = { load: recipients.get, store: recipients.save };

export function ReminderRecipientsSection({
  profile,
  session,
}: {
  profile: ProfileListItem;
  session: ProfileSession;
}) {
  const people = useReminderSetting('reminder-recipients', recipientIo, session, profile);
  return (
    <ReminderSettingSection
      title="Người nhận nhắc"
      query={people.query}
      loadingText="Đang tải người nhận nhắc…"
    >
      {(saved) => (
        <ReminderRecipientsForm
          saved={saved}
          pending={people.save.isPending}
          serverError={people.save.error?.message ?? null}
          done={people.save.isSuccess}
          onSubmit={(ids) => people.save.mutate(ids)}
        />
      )}
    </ReminderSettingSection>
  );
}
