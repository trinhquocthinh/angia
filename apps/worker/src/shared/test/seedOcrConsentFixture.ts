import { seedOcrConsentQuota } from './seedOcrConsentQuota.js';
import { createHash } from 'node:crypto';
import { budgetMonth } from '@angia/contracts';
import type { createSanitizePgFixture } from './createSanitizePgFixture.test-helper.js';
import { APPROVED_OCR_BYTES, seedExtractingDocument } from './seedExtractingDocument.js';
import { createMemoryExtractionDeps } from './createMemoryExtractionDeps.js';
import { createExtractionRepository } from '@src/features/extraction/infrastructure/createExtractionRepository.js';

// Chỉ AI và kho ảnh là giả; receipt, đọc lại đồng thuận, quota và operation dùng PostgreSQL thật.
export async function seedOcrConsentFixture(
  fx: Awaited<ReturnType<typeof createSanitizePgFixture>>,
  source: 'main_attested' | 'self',
) {
  const ids = await seedExtractingDocument(fx.owner);
  const now = new Date();
  const month = budgetMonth(now);
  await fx.owner.query(
    `UPDATE health_profiles SET consent_source=$2,consent_confirmed_by=
    (SELECT id FROM accounts WHERE family_id=$1),consent_basis=$3 WHERE family_id=$1`,
    [ids.familyId, source, source === 'self' ? 'self' : 'guardian'],
  );
  if (source === 'self')
    await fx.owner.query(
      `UPDATE accounts SET health_profile_id=
    (SELECT id FROM health_profiles WHERE family_id=$1) WHERE family_id=$1`,
      [ids.familyId],
    );
  await seedOcrConsentQuota(fx.owner, ids.familyId, month, now);
  const memory = createMemoryExtractionDeps({
    result: { ok: true, content: { type: 'prescription', items: [{ name: 'A' }] } },
  });
  const deps = {
    ...memory.deps,
    repository: createExtractionRepository(fx.pool, () => now),
    budget: { ...memory.deps.budget, now: () => now },
    ocrImages: {
      get: async () => ({
        bytes: APPROVED_OCR_BYTES,
        mimeType: 'image/jpeg',
        sha256: createHash('sha256').update(APPROVED_OCR_BYTES).digest('hex'),
      }),
    },
  };
  const counts = async () =>
    (
      await fx.owner.query(
        `SELECT used_scans::int AS used,held_scans::int AS held
    FROM family_scan_quotas WHERE family_id=$1 AND month=$2`,
        [ids.familyId, month],
      )
    ).rows[0];
  const withdraw = () =>
    fx.owner.query(
      `UPDATE health_profiles SET consent_status='withdrawn',consent_withdrawn_at=$2
    WHERE family_id=$1`,
      [ids.familyId, now],
    );
  return { ids, deps, memory, counts, withdraw };
}
