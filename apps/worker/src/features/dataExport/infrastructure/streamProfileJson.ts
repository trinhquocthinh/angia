import type pg from 'pg';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import { EXPORT_TABLE_QUERIES } from './exportTableQueries.js';
import { streamExportRows } from './streamExportRows.js';
import { exportJson } from './exportJson.js';

export async function* streamProfileJson(
  client: pg.PoolClient,
  familyId: string,
  profileId: string,
): AsyncIterable<Uint8Array> {
  const { rows } = await withFamilyScope(client, familyId, (db) =>
    db.query('SELECT * FROM health_profiles WHERE id = $1 AND family_id = $2', [profileId, familyId]),
  );
  if (!rows[0]) throw new Error('export_profile_missing');
  yield Buffer.from(`{"health_profiles":${exportJson(rows[0])}`);
  for (const table of EXPORT_TABLE_QUERIES) {
    yield Buffer.from(`,${JSON.stringify(table.name)}:[`);
    let separator = '';
    for await (const row of streamExportRows(client, familyId, profileId, table.sql)) {
      yield Buffer.from(separator + exportJson(row));
      separator = ',';
    }
    yield Buffer.from(']');
  }
  yield Buffer.from('}');
}
