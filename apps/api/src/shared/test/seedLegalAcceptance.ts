import type pg from 'pg';
import { newId } from '@src/shared/db/schema/newId.js';

// Fixture owner: seed bản v1 cố định, đồng ý các bản hiện hành để test cũ vẫn đi qua gate thật.
export async function seedLegalAcceptance(owner: pg.Client, accountId: string): Promise<void> {
  await owner.query(
    `INSERT INTO legal_document_versions
    (id,kind,version,published_at,material,content_path,sha256) VALUES
    ($1,'terms','1.0.0','2026-01-01',true,'legal/terms.md',repeat('a',64)),
    ($2,'privacy','1.0.0','2026-01-01',true,'legal/privacy.md',repeat('b',64))
    ON CONFLICT (kind,version) DO NOTHING`,
    [newId(), newId()],
  );
  const { rows } = await owner.query<{ id: string }>(`SELECT DISTINCT ON (kind) id
    FROM legal_document_versions WHERE published_at <= now() ORDER BY kind,published_at DESC,id DESC`);
  for (const row of rows) {
    await owner.query(
      `INSERT INTO legal_acceptances(id,account_ref,version_id)
      SELECT $1,legal_ref,$2 FROM accounts WHERE id=$3 ON CONFLICT (account_ref,version_id) DO NOTHING`,
      [newId(), row.id, accountId],
    );
  }
}
