import { createHash, randomUUID } from 'node:crypto';
import type pg from 'pg';

/** Byte JPEG tối thiểu của ảnh OCR đã duyệt trong integration test; hash được ghi vào chứng từ. */
export const APPROVED_OCR_BYTES = new Uint8Array([0xff, 0xd8, 0xff]);

// Gia đình + main + hồ sơ + lô + chứng từ bằng role owner. approved = true: đã duyệt riêng tư, trạng thái extracting;
// false: uploaded, chưa có ảnh OCR.
export async function seedExtractingDocument(
  owner: pg.Client,
  declaredType: string | null = null,
  approved = true,
) {
  const [familyId, profileId, batchId, documentId, accountId] = [
    randomUUID(),
    randomUUID(),
    randomUUID(),
    randomUUID(),
    randomUUID(),
  ];
  await owner.query(`INSERT INTO families(id, name) VALUES ($1, 'Nhà')`, [familyId]);
  await owner.query(
    `INSERT INTO accounts(id, oidc_subject, display_name, family_id, family_role) VALUES ($1, $3, 'Main', $2, 'main')`,
    [accountId, familyId, `sub-${accountId}`],
  );
  await owner.query(`INSERT INTO health_profiles(id, family_id, display_name) VALUES ($1, $2, 'Mẹ')`, [
    profileId,
    familyId,
  ]);
  await owner.query(
    `INSERT INTO upload_batches(id, family_id, health_profile_id, created_by) VALUES ($1, $2, $3, $4)`,
    [batchId, familyId, profileId, accountId],
  );
  const folder = `families/${familyId}/profiles/${profileId}/documents/${documentId}`;
  await owner.query(
    `INSERT INTO source_documents(id, family_id, health_profile_id, batch_id, type, status, original_key, mime_type, size_bytes, ocr_image_key, ocr_image_sha256, privacy_approved_by, privacy_approved_at)
     VALUES ($1, $2, $3, $4, $5, CASE WHEN $8::uuid IS NOT NULL THEN 'extracting' ELSE 'uploaded' END, $9, 'image/jpeg', 3, $6, $7, $8, CASE WHEN $8::uuid IS NOT NULL THEN now() ELSE NULL END)`,
    [
      documentId,
      familyId,
      profileId,
      batchId,
      declaredType,
      approved ? `${folder}/ocr.jpg` : null,
      approved ? createHash('sha256').update(APPROVED_OCR_BYTES).digest('hex') : null,
      approved ? accountId : null,
      `${folder}/original.jpg`,
    ],
  );
  return { familyId, documentId };
}
