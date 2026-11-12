import { pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { idColumn } from './columns.js';
import { legalDocumentVersions } from './legalDocumentVersions.js';

// account_ref là legal_ref ngẫu nhiên từ đầu, không FK/cascade về accounts.
// Migration chỉ cấp INSERT/SELECT cho role app; xoá account không sửa lịch sử này.
export const legalAcceptances = pgTable(
  'legal_acceptances',
  {
    id: idColumn(),
    accountRef: text('account_ref').notNull(),
    versionId: uuid('version_id')
      .notNull()
      .references(() => legalDocumentVersions.id),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('legal_acceptances_account_version_unique').on(t.accountRef, t.versionId)],
);
