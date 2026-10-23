import { sql } from 'drizzle-orm';
import {
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { createdAtColumn, familyIdColumn, familyIsolationPolicy, idColumn } from './columns.js';
import { pushSubscriptions } from './pushSubscriptions.js';
import { reminders } from './reminders.js';

// E9-S2-T2: ledger gửi lời nhắc theo từng thiết bị — một dòng cho mỗi (lời nhắc, đăng ký push).
// Không lưu account_id/endpoint/keys; người nhận kiểm lại qua push_subscriptions mỗi lần gửi.
// push_subscription_id FK đơn SET NULL để giữ lịch sử khi gỡ thiết bị mà không null family_id.
// accepted_at là lúc push service trả 2xx, không phải lúc người dùng xem/đọc.
export const reminderDeliveries = pgTable(
  'reminder_deliveries',
  {
    id: idColumn(),
    familyId: familyIdColumn(),
    reminderId: uuid('reminder_id').notNull(),
    pushSubscriptionId: uuid('push_subscription_id').references(() => pushSubscriptions.id, {
      onDelete: 'set null',
    }),
    status: text('status', {
      enum: ['pending', 'accepted', 'gone', 'failed', 'expired', 'revoked'],
    }).notNull(),
    attempts: integer('attempts').notNull().default(0),
    nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true }),
    lastError: text('last_error'),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    createdAt: createdAtColumn(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('reminder_deliveries_reminder_device_unique').on(t.reminderId, t.pushSubscriptionId),
    foreignKey({
      name: 'reminder_deliveries_reminder_family_fk',
      columns: [t.reminderId, t.familyId],
      foreignColumns: [reminders.id, reminders.familyId],
    }).onDelete('cascade'),
    index('reminder_deliveries_pending_idx')
      .on(t.nextAttemptAt)
      .where(sql`${t.status} = 'pending'`),
    check(
      'reminder_deliveries_status_valid',
      sql`${t.status} IN ('pending', 'accepted', 'gone', 'failed', 'expired', 'revoked')`,
    ),
    check('reminder_deliveries_attempts_valid', sql`${t.attempts} BETWEEN 0 AND 6`),
    familyIsolationPolicy(),
  ],
);
