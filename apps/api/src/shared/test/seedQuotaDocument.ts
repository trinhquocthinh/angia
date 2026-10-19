import { randomUUID } from 'node:crypto';
import type { ProfileTestApp } from './startProfileTestApp.js';

interface QuotaOwner {
  familyId: string;
  profileId: string;
  accountId: string;
}

interface QuotaDocument {
  status: string;
  sizeBytes: number;
  createdAt?: Date;
  privacyDraftPending?: boolean;
}

// Chứng từ chỉ để đếm quota (SPEC-030): chèn bằng role owner, không có ảnh S3 hay bản trích xuất.
export async function seedQuotaDocument(t: ProfileTestApp, owner: QuotaOwner, document: QuotaDocument) {
  const batchId = randomUUID();
  const documentId = randomUUID();
  const { familyId, profileId } = owner;
  await t.owner.query(
    'INSERT INTO upload_batches(id,family_id,health_profile_id,created_by) VALUES ($1,$2,$3,$4)',
    [batchId, familyId, profileId, owner.accountId],
  );
  const draftId = document.privacyDraftPending ? randomUUID() : null;
  await t.owner.query(
    `INSERT INTO source_documents(id,family_id,health_profile_id,batch_id,status,original_key,mime_type,size_bytes,
       privacy_draft_id,privacy_draft_status,created_at)
     VALUES ($1,$2,$3,$4,$5,$6,'image/jpeg',$7,$8,$9,$10)`,
    [
      documentId,
      familyId,
      profileId,
      batchId,
      document.status,
      `families/${familyId}/profiles/${profileId}/documents/${documentId}/original.jpg`,
      document.sizeBytes,
      draftId,
      draftId ? 'pending' : null,
      document.createdAt ?? new Date(),
    ],
  );
  return documentId;
}
