import type pg from 'pg';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';

// Cursor có tối đa 100 dòng trong RAM; mọi thao tác đọc đều ở scope gia đình.
export async function* streamExportRows(
  client: pg.PoolClient,
  familyId: string,
  profileId: string,
  sql: string,
): AsyncIterable<Record<string, unknown>> {
  await withFamilyScope(client, familyId, (db) =>
    db.query(`DECLARE export_rows NO SCROLL CURSOR FOR ${sql}`, [profileId, familyId]),
  );
  try {
    while (true) {
      const { rows } = await withFamilyScope(client, familyId, (db) =>
        db.query('FETCH FORWARD 100 FROM export_rows'),
      );
      if (!rows.length) break;
      for (const row of rows) yield row as Record<string, unknown>;
    }
  } finally {
    await withFamilyScope(client, familyId, (db) => db.query('CLOSE export_rows'));
  }
}
