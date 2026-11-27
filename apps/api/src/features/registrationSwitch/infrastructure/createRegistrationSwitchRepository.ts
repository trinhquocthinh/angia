import { sql } from 'drizzle-orm';
import { writeAdminAuditEvent } from '@src/shared/audit/writeAdminAuditEvent.js';
import type { Database } from '@src/shared/db/createDatabase.js';
import { systemSettings } from '@src/shared/db/schema/index.js';
import type { RegistrationSwitchRepository } from '../application/ports.js';

export function createRegistrationSwitchRepository(db: Database): RegistrationSwitchRepository {
  return {
    setOpen: (actorAccountId, open) =>
      db.transaction(async (tx) => {
        const values = { value: open, updatedBy: actorAccountId, updatedAt: sql`now()` };
        await tx
          .insert(systemSettings)
          .values({ key: 'registration_open', ...values })
          .onConflictDoUpdate({ target: systemSettings.key, set: values });
        await writeAdminAuditEvent(tx, { actorAccountId, action: 'registration_switch_changed' });
      }),
  };
}
