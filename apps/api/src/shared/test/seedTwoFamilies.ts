import { randomUUID } from 'node:crypto';
import pg from 'pg';

export interface TwoFamilies {
  familyA: string;
  familyB: string;
  profilesA: string[];
  profilesB: string[];
}

// Nhóm A có 3 hồ sơ, nhóm B có 4 (SPEC-006); mỗi nhóm có đủ dòng ở mọi bảng RLS.
// Chạy bằng role owner: owner không chịu RLS nên nạp được dữ liệu cho cả hai nhóm.
export async function seedTwoFamilies(ownerUrl: string): Promise<TwoFamilies> {
  const client = new pg.Client({ connectionString: ownerUrl });
  await client.connect();
  try {
    const familyA = await seedFamily(client, 'Nhà A', 3);
    const familyB = await seedFamily(client, 'Nhà B', 4);
    return {
      familyA: familyA.familyId,
      familyB: familyB.familyId,
      profilesA: familyA.profileIds,
      profilesB: familyB.profileIds,
    };
  } finally {
    await client.end();
  }
}

async function seedFamily(client: pg.Client, name: string, profileCount: number) {
  const familyId = randomUUID();
  const accountId = randomUUID();
  await client.query(`INSERT INTO families (id, name) VALUES ($1, $2)`, [familyId, name]);
  await client.query(
    `INSERT INTO accounts (id, oidc_subject, display_name, family_id, family_role) VALUES ($1, $2, $3, $4, 'main')`,
    [accountId, `sub-${accountId}`, `Main ${name}`, familyId],
  );
  const profileIds: string[] = [];
  for (let index = 0; index < profileCount; index += 1) {
    const profileId = randomUUID();
    profileIds.push(profileId);
    await client.query(`INSERT INTO health_profiles (id, family_id, display_name) VALUES ($1, $2, $3)`, [
      profileId,
      familyId,
      `Hồ sơ ${index + 1}`,
    ]);
  }
  await seedDocumentChain(client, familyId, profileIds[0] ?? '', accountId);
  return { familyId, profileIds };
}

async function seedDocumentChain(client: pg.Client, familyId: string, profileId: string, accountId: string) {
  const [batchId, documentId] = [randomUUID(), randomUUID()];
  await client.query(
    `INSERT INTO upload_batches (id, family_id, health_profile_id, created_by) VALUES ($1, $2, $3, $4)`,
    [batchId, familyId, profileId, accountId],
  );
  await client.query(
    `INSERT INTO source_documents (id, family_id, health_profile_id, batch_id, status, original_key, mime_type, size_bytes)
     VALUES ($1, $2, $3, $4, 'pending_review', 'k', 'image/jpeg', 10)`,
    [documentId, familyId, profileId, batchId],
  );
  await client.query(
    `INSERT INTO extractions (id, family_id, source_document_id, provider, model, payload, cost_usd)
     VALUES ($1, $2, $3, 'fake', 'fake', '{}', 0)`,
    [randomUUID(), familyId, documentId],
  );
  await client.query(
    `INSERT INTO measurements (id, family_id, health_profile_id, source_document_id, kind, measured_on, systolic, diastolic)
     VALUES ($1, $2, $3, $4, 'blood_pressure', '2026-10-01', 130, 80)`,
    [randomUUID(), familyId, profileId, documentId],
  );
}
