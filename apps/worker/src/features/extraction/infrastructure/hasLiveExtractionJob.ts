import type pg from 'pg';

// Recovery chạy trong scope và khóa operation; job trùng chết không được hủy retry còn sống.
export async function hasLiveExtractionJob(client: pg.PoolClient, familyId: string, documentId: string) {
  const result = await client.query(
    `SELECT 1 FROM pgboss.job
    WHERE name='extract-document' AND data->>'documentId'=$1 AND data->>'familyId'=$2
    AND state IN ('created','retry','active') LIMIT 1`,
    [documentId, familyId],
  );
  return result.rowCount === 1;
}
