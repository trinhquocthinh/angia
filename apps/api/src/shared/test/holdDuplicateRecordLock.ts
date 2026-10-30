import { sql } from 'drizzle-orm';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import type { ProfileTestApp } from './startProfileTestApp.js';

// Khóa độc lập với adapter production để kiểm request thật chờ đúng khóa SPEC-012.
export async function holdDuplicateRecordLock(t: ProfileTestApp, familyId: string, key: string) {
  let release: () => void = () => undefined;
  let acquired: () => void = () => undefined;
  const wait = new Promise<void>((resolve) => {
    release = resolve;
  });
  const ready = new Promise<void>((resolve) => {
    acquired = resolve;
  });
  const holder = withFamilyScope(t.database, familyId, async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`);
    acquired();
    await wait;
  });
  await Promise.race([ready, holder]);
  return async () => {
    release();
    await holder;
  };
}
