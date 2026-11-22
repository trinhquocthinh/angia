import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

// SPEC-073: giữ tên đăng nhập đã xoá 90 ngày; chỉ lưu HMAC, tra trước khi biết nhà nên không RLS.
export const deletedUsernames = pgTable('deleted_usernames', {
  usernameHash: text('username_hash').primaryKey(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }).notNull(),
});
