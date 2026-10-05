import { sql } from 'drizzle-orm';
import { pgPolicy, timestamp, uuid } from 'drizzle-orm/pg-core';
import { families } from './families.js';
import { newId } from './newId.js';

export const idColumn = () => uuid('id').primaryKey().$defaultFn(newId);

export const createdAtColumn = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

export const familyIdColumn = () =>
  uuid('family_id')
    .notNull()
    .references(() => families.id);

// Chính sách cô lập đa gia đình (Tech Spec §3, BR-003); drizzle-kit tự bật RLS cho bảng có policy.
// Hết SET LOCAL, biến trở về '' (không phải NULL) trên kết nối của pool: NULLIF để vẫn trả 0 dòng thay vì lỗi ép kiểu.
export const familyIsolationPolicy = () =>
  pgPolicy('family_isolation_policy', {
    as: 'permissive',
    for: 'all',
    to: 'public',
    using: sql`family_id = NULLIF(current_setting('app.family_id', true), '')::uuid`,
  });
