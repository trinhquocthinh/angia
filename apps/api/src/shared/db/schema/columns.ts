import { type SQL, sql } from 'drizzle-orm';
import { pgPolicy, timestamp, uuid } from 'drizzle-orm/pg-core';
import { families } from './families.js';
import { newId } from './newId.js';

export const idColumn = () => uuid('id').primaryKey().$defaultFn(newId);

export const createdAtColumn = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

export const familyIdColumn = () =>
  uuid('family_id')
    .notNull()
    .references(() => families.id);

const SAME_FAMILY = sql`family_id = NULLIF(current_setting('app.family_id', true), '')::uuid`;
const NOT_SELF_SCOPE = sql`NULLIF(current_setting('app.self_profile_id', true), '') IS NULL`;

const isolationPolicy = (using: SQL) =>
  pgPolicy('family_isolation_policy', { as: 'permissive', for: 'all', to: 'public', using });

// Chính sách cô lập đa gia đình (Tech Spec §3, BR-003); drizzle-kit tự bật RLS cho bảng có policy.
// Hết SET LOCAL, biến trở về '' (không phải NULL) trên kết nối của pool: NULLIF để vẫn trả 0 dòng thay vì lỗi ép kiểu.
// Bảng không gắn với hồ sơ: chặn hẳn khi đang ở phạm vi tự xem (fail closed, Tech Spec §3.9.3).
export const familyIsolationPolicy = () => isolationPolicy(sql`${SAME_FAMILY} AND ${NOT_SELF_SCOPE}`);

// Bảng có quan hệ với hồ sơ: phạm vi tự xem chỉ thấy dòng thỏa điều kiện; ngoài phạm vi này hành vi như cũ.
export const selfIsolationPolicyWhen = (belongsToSelf: SQL) =>
  isolationPolicy(sql`${SAME_FAMILY} AND (${NOT_SELF_SCOPE} OR ${belongsToSelf})`);

export const selfIsolationPolicy = (profileColumn: 'health_profile_id' | 'profile_id' | 'id') =>
  selfIsolationPolicyWhen(
    sql`${sql.raw(profileColumn)} = NULLIF(current_setting('app.self_profile_id', true), '')::uuid`,
  );
