import { eq } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import { systemSettings } from '@src/shared/db/schema/index.js';
import type { RegistrationGate } from '../application/ports.js';

export function createRegistrationGate(db: Pick<Database, 'select'>): RegistrationGate {
  return {
    async isOpen(): Promise<boolean> {
      const [row] = await db
        .select({ value: systemSettings.value })
        .from(systemSettings)
        .where(eq(systemSettings.key, 'registration_open'))
        .limit(1);
      if (!row || row.value === null || row.value === undefined) return true;
      return row.value === true || row.value === 'true';
    },
  };
}
