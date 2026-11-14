import { sql } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import type { LegalRequirement } from '../domain/LegalRequirement.js';

type RequirementRow = {
  kind: 'terms' | 'privacy';
  currentPublishedAt: string;
  materialPublishedAt: string | null;
  acceptedPublishedAt: string | null;
};

export async function readLegalRequirements(
  db: Pick<Database, 'execute'>,
  accountId: string,
  now: Date,
): Promise<LegalRequirement[]> {
  // Một truy vấn cho cả hai kind và lịch sử theo legal_ref; accounts không có RLS family.
  const { rows } = await db.execute<RequirementRow>(sql`
    SELECT d.kind, max(d.published_at) AS "currentPublishedAt",
      max(d.published_at) FILTER (WHERE d.material) AS "materialPublishedAt",
      max(d.published_at) FILTER (WHERE a.version_id IS NOT NULL) AS "acceptedPublishedAt"
    FROM legal_document_versions d
    LEFT JOIN legal_acceptances a ON a.version_id = d.id
      AND a.account_ref = (SELECT legal_ref FROM accounts WHERE id = ${accountId})
    WHERE d.published_at <= ${now}
    GROUP BY d.kind
  `);
  // execute(sql) không chạy mapper của column timestamp như select() thông thường.
  return rows.map((row) => ({
    kind: row.kind,
    currentPublishedAt: new Date(row.currentPublishedAt),
    materialPublishedAt: row.materialPublishedAt === null ? null : new Date(row.materialPublishedAt),
    acceptedPublishedAt: row.acceptedPublishedAt === null ? null : new Date(row.acceptedPublishedAt),
  }));
}
