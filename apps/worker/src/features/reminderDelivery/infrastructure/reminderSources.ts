export const REMINDER_SOURCES = {
  medication: { table: 'reminders', key: 'reminder_id' },
  revisit: { table: 'revisit_reminders', key: 'revisit_reminder_id' },
} as const;
