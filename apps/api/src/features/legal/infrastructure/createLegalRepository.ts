import { newId } from '@src/shared/db/schema/newId.js';
import { sql } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import type { LegalRepository } from '../application/ports.js';
import { readLegalRequirements } from './readLegalRequirements.js';
import { isLegalAcceptanceSatisfied } from '../domain/isLegalAcceptanceSatisfied.js';
import { readCurrentLegalDocuments } from './readCurrentLegalDocuments.js';

export function createLegalRepository(db: Database, now: () => Date = () => new Date()): LegalRepository {
  return {
    current: () => readCurrentLegalDocuments(db, now()),
    async status(accountId) {
      const requirements = await readLegalRequirements(db, accountId, now());
      return {
        accepted: isLegalAcceptanceSatisfied(requirements),
        missingDocuments: requirements.length !== 2,
      };
    },
    async accept(accountId, versionIds) {
      return db.transaction(
        async (tx) => {
          // Kiểm bản hiện hành và ghi trên cùng snapshot; sai bất kỳ ID nào thì không INSERT.
          const docs = await readCurrentLegalDocuments(tx, now());
          const current = { termsVersionId: docs.terms.id, privacyVersionId: docs.privacy.id };
          const ids = Object.values(current);
          if (versionIds.some((id) => !ids.includes(id))) return { ok: false, current };
          const requested = sql.join(
            versionIds.map((id) => sql`(${newId()}::uuid, ${id}::uuid)`),
            sql`, `,
          );
          await tx.execute(sql`
            WITH requested(id, version_id) AS (VALUES ${requested})
            INSERT INTO legal_acceptances (id, account_ref, version_id)
            SELECT r.id, a.legal_ref, r.version_id FROM accounts a CROSS JOIN requested r
            WHERE a.id = ${accountId}
            ON CONFLICT (account_ref, version_id) DO NOTHING
          `);
          return { ok: true, current };
        },
        { isolationLevel: 'repeatable read' },
      );
    },
  };
}
