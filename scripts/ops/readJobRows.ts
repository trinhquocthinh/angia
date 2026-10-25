import pg from 'pg';

export interface JobRow {
  name: string;
  documentId: string | null;
  state: string;
  retryCount: number;
  createdOn: Date;
  startedOn: Date | null;
  completedOn: Date | null;
  output: unknown;
}

export const EXTRACT_QUEUE = 'extract-document';
export const PREPARE_QUEUE = 'prepare-ocr-image';

// Chỉ đọc metadata job pg-boss (mã chứng từ, mốc thời gian, outcome) — không chạm bảng dữ liệu sức khỏe
// nên không cần withFamilyScope; role app đã có quyền DML trên schema `pgboss`.
const SQL = `
  SELECT name, data->>'documentId' AS document_id, state::text AS state, retry_count,
         created_on, started_on, completed_on, output
  FROM pgboss.job
  WHERE name = ANY($1::text[]) AND created_on >= $2 AND state IN ('completed', 'failed')
  ORDER BY created_on`;

interface RawRow {
  name: string;
  document_id: string | null;
  state: string;
  retry_count: number;
  created_on: Date;
  started_on: Date | null;
  completed_on: Date | null;
  output: unknown;
}

export async function readJobRows(connectionString: string, since: Date): Promise<JobRow[]> {
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    await client.query('SET default_transaction_read_only = on');
    const { rows } = await client.query<RawRow>(SQL, [[EXTRACT_QUEUE, PREPARE_QUEUE], since]);
    return rows.map((row) => ({
      name: row.name,
      documentId: row.document_id,
      state: row.state,
      retryCount: row.retry_count,
      createdOn: row.created_on,
      startedOn: row.started_on,
      completedOn: row.completed_on,
      output: row.output,
    }));
  } finally {
    await client.end();
  }
}
