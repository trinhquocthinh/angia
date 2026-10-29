import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { HealthProfile, UploadBatchResponse } from '@angia/contracts';
import { acceptConsentInvitation } from '@src/shared/test/acceptConsentInvitation.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import type { SeededSession } from '@src/shared/test/seedAuthFixtures.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

const JPEG = new Uint8Array([255, 216, 255, 224]);
const PNG = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const HEIC = new Uint8Array([0, 0, 0, 24, 102, 116, 121, 112, 104, 101, 105, 99, 0, 0, 0, 0]);
const WEBP = new TextEncoder().encode('RIFF0000WEBP');

describe('Upload JPEG đã che, receipt và quota (E11-S2-T1)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  const household = async () => {
    const familyId = await t.family();
    const main = await t.session(familyId);
    const response = await t.call(main, 'POST', '/api/health-profiles', { displayName: 'Mẹ' });
    const profileId = ((await response.json()) as HealthProfile).id;
    await acceptConsentInvitation(t, main, profileId);
    return { familyId, main, profileId };
  };
  const upload = (main: SeededSession, profileId: string, files = [JPEG], flags?: string) => {
    const form = new FormData();
    files.forEach((bytes, i) => form.append('files', new File([bytes], `${i}.jpg`)));
    if (flags !== undefined) form.append('sendToAi', flags);
    return t.app.request(`/api/health-profiles/${profileId}/upload-batches`, {
      method: 'POST',
      headers: { cookie: main.cookie, 'x-csrf-token': main.csrf },
      body: form,
    });
  };
  const seed = async (home: Awaited<ReturnType<typeof household>>, pending: number) => {
    const batchId = randomUUID();
    await t.owner.query(
      'INSERT INTO upload_batches(id,family_id,health_profile_id,created_by) VALUES ($1,$2,$3,$4)',
      [batchId, home.familyId, home.profileId, home.main.accountId],
    );
    for (let i = 0; i < pending; i += 1) {
      await t.owner.query(
        `INSERT INTO source_documents
        (id,family_id,health_profile_id,batch_id,status,image_key,privacy_approved_by,privacy_approved_at,mime_type,size_bytes)
        VALUES ($1,$2,$3,$4,'uploaded',$5,$6,now(),'image/jpeg',4)`,
        [randomUUID(), home.familyId, home.profileId, batchId, `pending/${i}.jpg`, home.main.accountId],
      );
    }
    return batchId;
  };
  it('TC-406: lô JPEG + PNG ghi receipt và job đúng ID trong transaction', async () => {
    const home = await household();
    const response = await upload(home.main, home.profileId, [JPEG, PNG], '[true,true]');
    expect(response.status).toBe(201);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const batch = (await response.json()) as UploadBatchResponse;
    expect(batch.rejectedFiles).toEqual([{ fileName: '1.jpg', code: 'ERR_UNSUPPORTED_FILE' }]);
    expect(batch.documents).toHaveLength(1);
    const id = batch.documents[0]!.id;
    expect(batch.documents[0]).toMatchObject({ status: 'uploaded', hasImage: true });
    const { rows } = await t.owner.query(
      `SELECT image_key,image_sha256,privacy_approved_by,
      privacy_approved_at,status FROM source_documents WHERE id=$1`,
      [id],
    );
    expect(rows[0]).toEqual({
      image_key: `families/${home.familyId}/profiles/${home.profileId}/documents/${id}/upload.jpg`,
      image_sha256: null,
      privacy_approved_by: home.main.accountId,
      privacy_approved_at: expect.any(Date),
      status: 'uploaded',
    });
    expect(t.objects.has(rows[0].image_key)).toBe(true);
    const jobs = await t.owner.query('SELECT id,name,data FROM pgboss.job WHERE id=$1', [id]);
    expect(jobs.rows).toEqual([
      { id, name: 'sanitize-document-image', data: { documentId: id, familyId: home.familyId } },
    ]);
  });
  it.each([undefined, '[false]'])('TC-407: thiếu cờ hoặc tự nhập (%s) không có receipt', async (flags) => {
    const home = await household();
    const response = await upload(home.main, home.profileId, [JPEG], flags);
    expect(response.status).toBe(201);
    const batch = (await response.json()) as UploadBatchResponse;
    const { rows } = await t.owner.query(
      'SELECT privacy_approved_by,privacy_approved_at FROM source_documents WHERE id=$1',
      [batch.documents[0]!.id],
    );
    expect(rows[0]).toEqual({ privacy_approved_by: null, privacy_approved_at: null });
  });
  it.each([PNG, HEIC, WEBP])('TC-404: lô toàn định dạng ngoài JPEG không ghi object', async (bytes) => {
    const home = await household();
    const before = t.objects.size;
    const response = await upload(home.main, home.profileId, [bytes]);
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_NO_VALID_FILE' } });
    expect(t.objects.size).toBe(before);
  });
  it.each(['[true,false]', '["true"]', 'null', '['])(
    'TC-405: cờ sai %s không ghi chứng từ',
    async (flags) => {
      const home = await household();
      const response = await upload(home.main, home.profileId, [JPEG], flags);
      expect(response.status).toBe(422);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_VALIDATION' } });
      const count = await t.owner.query(
        'SELECT count(*)::int AS n FROM source_documents WHERE family_id=$1',
        [home.familyId],
      );
      expect(count.rows[0].n).toBe(0);
    },
  );
  it('TC-407: S3 lỗi giữa lô rollback cả receipt và job đã enqueue', async () => {
    const home = await household();
    const before = t.objects.size;
    t.failNthPut(2);
    expect((await upload(home.main, home.profileId, [JPEG, JPEG], '[true,false]')).status).toBe(500);
    const docs = await t.owner.query('SELECT count(*)::int AS n FROM source_documents WHERE family_id=$1', [
      home.familyId,
    ]);
    const jobs = await t.owner.query(
      "SELECT count(*)::int AS n FROM pgboss.job WHERE name='sanitize-document-image' AND data->>'familyId'=$1",
      [home.familyId],
    );
    expect(docs.rows[0].n).toBe(0);
    expect(jobs.rows[0].n).toBe(0);
    expect(t.objects.size).toBe(before);
  });
  it('TC-406: nhóm khác không tải lên được hồ sơ dù khai gửi AI', async () => {
    const home = await household();
    const other = await t.session(await t.family());
    await expectCrossFamilyDenied(
      () => upload(other, home.profileId, [JPEG], '[true]'),
      () => upload(other, randomUUID(), [JPEG], '[true]'),
    );
  });
  it('TC-299, TC-438: chặn lô AI vượt trần; nhận lô trộn và tự nhập', async () => {
    const home = await household();
    await seed(home, 9);
    const before = t.objects.size;
    const blocked = await upload(home.main, home.profileId, [JPEG, JPEG], '[true,true]');
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('retry-after')).toBe('30');
    expect(await blocked.json()).toMatchObject({
      error: { code: 'ERR_QUEUE_QUOTA', details: { used: 9, requested: 2 } },
    });
    expect(t.objects.size).toBe(before);
    expect((await upload(home.main, home.profileId, [JPEG, JPEG], '[true,false]')).status).toBe(201);
    const fullObjects = t.objects.size;
    const full = await upload(home.main, home.profileId, [JPEG], '[true]');
    expect(full.status).toBe(429);
    expect(full.headers.get('retry-after')).toBe('30');
    expect(await full.json()).toMatchObject({
      error: {
        code: 'ERR_QUEUE_QUOTA',
        details: { used: 10, limit: 10, requested: 1 },
      },
    });
    expect(t.objects.size).toBe(fullObjects);
    expect((await upload(home.main, home.profileId, [JPEG, JPEG], '[false,false]')).status).toBe(201);
    const usage = await t.call(home.main, 'GET', '/api/family/usage');
    expect(usage.status).toBe(200);
    expect(await usage.json()).toMatchObject({ pendingJobs: { used: 10 } });
  });
  it('TC-438: ảnh NULL không tính byte, uploaded tự nhập và AI quá một giờ không tính chờ', async () => {
    const home = await household();
    const batchId = await seed(home, 1);
    await t.owner.query(`UPDATE source_documents SET created_at=now()-interval '2 hours' WHERE batch_id=$1`, [
      batchId,
    ]);
    await t.owner.query(
      `INSERT INTO source_documents
      (id,family_id,health_profile_id,batch_id,status,mime_type,size_bytes)
      VALUES ($1,$2,$3,$4,'manual_entry','image/jpeg',999999)`,
      [randomUUID(), home.familyId, home.profileId, batchId],
    );
    expect((await upload(home.main, home.profileId, [JPEG], '[false]')).status).toBe(201);
    const response = await t.call(home.main, 'GET', '/api/family/usage');
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ storage: { usedBytes: 8 }, pendingJobs: { used: 0 } });
  });
  it('TC-438: usage đọc kích thước ảnh sau làm sạch và bỏ byte khi ảnh NULL', async () => {
    const home = await household();
    const batchId = await seed(home, 1);
    const usage = async () => {
      const response = await t.call(home.main, 'GET', '/api/family/usage');
      expect(response.status).toBe(200);
      return response.json();
    };

    expect(await usage()).toMatchObject({ storage: { usedBytes: 4 } });

    // Mô phỏng trạng thái DB sau CAS; CAS thật được kiểm ở TC-416.
    await t.owner.query(
      `UPDATE source_documents
       SET image_key=$2,image_sha256=$3,size_bytes=2,status='extracting'
       WHERE batch_id=$1`,
      [batchId, `sanitized/${randomUUID()}.jpg`, 'a'.repeat(64)],
    );
    expect(await usage()).toMatchObject({
      storage: { usedBytes: 2 },
      pendingJobs: { used: 1 },
    });

    await t.owner.query(
      `UPDATE source_documents
       SET image_key=NULL,image_sha256=NULL,status='manual_entry'
       WHERE batch_id=$1`,
      [batchId],
    );
    expect(await usage()).toMatchObject({
      storage: { usedBytes: 0 },
      pendingJobs: { used: 0 },
    });
  });
  it('TC-438: hai lô AI đồng thời khi có 9 chờ chỉ nhận một lô', async () => {
    const home = await household();
    await seed(home, 9);
    const before = t.objects.size;

    const responses = await Promise.all([
      upload(home.main, home.profileId, [JPEG], '[true]'),
      upload(home.main, home.profileId, [JPEG], '[true]'),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([201, 429]);
    const rejected = responses.find((response) => response.status === 429)!;
    expect(rejected.headers.get('retry-after')).toBe('30');
    expect(await rejected.json()).toMatchObject({
      error: { code: 'ERR_QUEUE_QUOTA', details: { used: 10, requested: 1 } },
    });
    expect(t.objects.size).toBe(before + 1);

    const documents = await t.owner.query(
      'SELECT count(*)::int AS n FROM source_documents WHERE family_id=$1',
      [home.familyId],
    );
    const jobs = await t.owner.query(
      `SELECT count(*)::int AS n FROM pgboss.job
       WHERE name='sanitize-document-image' AND data->>'familyId'=$1`,
      [home.familyId],
    );
    expect(documents.rows[0].n).toBe(10);
    expect(jobs.rows[0].n).toBe(1);
  });
});
