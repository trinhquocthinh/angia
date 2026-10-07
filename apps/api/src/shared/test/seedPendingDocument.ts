import { randomUUID } from 'node:crypto';
import type { ProfileTestApp } from './startProfileTestApp.js';

export const PENDING_JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);

interface Owner {
  familyId: string;
  profileId: string;
  accountId: string;
}

// Chứng từ như vừa qua worker: pending_review + bản trích xuất + ảnh gốc trong S3 giả (chèn bằng role owner).
export async function seedPendingDocument(t: ProfileTestApp, owner: Owner, payload: object) {
  const batchId = randomUUID();
  const documentId = randomUUID();
  const { familyId, profileId } = owner;
  const key = `families/${familyId}/profiles/${profileId}/documents/${documentId}/original.jpg`;
  await t.owner.query(
    'INSERT INTO upload_batches(id,family_id,health_profile_id,created_by) VALUES ($1,$2,$3,$4)',
    [batchId, familyId, profileId, owner.accountId],
  );
  await t.owner.query(
    `INSERT INTO source_documents(id,family_id,health_profile_id,batch_id,type,status,original_key,mime_type,size_bytes)
     VALUES ($1,$2,$3,$4,'device_reading','pending_review',$5,'image/jpeg',$6)`,
    [documentId, familyId, profileId, batchId, key, PENDING_JPEG.length],
  );
  await t.owner.query(
    `INSERT INTO extractions(id,family_id,source_document_id,provider,model,payload,cost_usd)
     VALUES ($1,$2,$3,'fake','fake',$4,0)`,
    [randomUUID(), familyId, documentId, payload],
  );
  t.objects.set(key, { body: PENDING_JPEG, contentType: 'image/jpeg' });
  return { documentId, key };
}
