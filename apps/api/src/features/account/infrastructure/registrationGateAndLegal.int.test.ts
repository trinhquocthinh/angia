import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDatabase, type Database } from '@src/shared/db/createDatabase.js';
import { runMigrations } from '@src/shared/db/runMigrations.js';
import { systemSettings } from '@src/shared/db/schema/index.js';
import { startTestDatabase, type TestDatabase } from '@src/shared/test/startTestDatabase.js';
import { createLegalVersions } from './createLegalVersions.js';
import { createRegistrationGate } from './createRegistrationGate.js';

describe('Gate đăng ký và phiên bản pháp lý (Integration role app)', () => {
  let testDb: TestDatabase;
  let pool: pg.Pool;
  let db: Database;
  const termsId = randomUUID();
  const privacyId = randomUUID();
  const futureTermsId = randomUUID();

  beforeAll(async () => {
    testDb = await startTestDatabase();
    await runMigrations(testDb.ownerUrl);

    // Seed legal_document_versions bằng role owner (role app chỉ có quyền SELECT)
    const owner = new pg.Client({ connectionString: testDb.ownerUrl });
    await owner.connect();
    try {
      await owner.query(
        `INSERT INTO legal_document_versions
           (id, kind, version, published_at, material, content_path, sha256)
         VALUES
           ($1, 'terms', '1.0.0', '2026-01-01T00:00:00Z', true, 'legal/terms-1.0.md', repeat('a', 64)),
           ($2, 'privacy', '1.0.0', '2026-01-01T00:00:00Z', true, 'legal/privacy-1.0.md', repeat('b', 64)),
           ($3, 'terms', '2.0.0', '2099-01-01T00:00:00Z', true, 'legal/terms-2.0.md', repeat('c', 64))`,
        [termsId, privacyId, futureTermsId],
      );
    } finally {
      await owner.end();
    }

    pool = new pg.Pool({ connectionString: testDb.appUrl });
    db = createDatabase(pool);
  });

  afterAll(async () => {
    await pool?.end();
    await testDb?.container.stop();
  });

  it('RegistrationGate: thiếu cấu hình registration_open trả về true (mặc định mở)', async () => {
    const gate = createRegistrationGate(db);
    expect(await gate.isOpen()).toBe(true);
  });

  it('RegistrationGate: khi registration_open là false thì đóng, khi true thì mở', async () => {
    const gate = createRegistrationGate(db);
    await db
      .insert(systemSettings)
      .values({ key: 'registration_open', value: false })
      .onConflictDoUpdate({ target: systemSettings.key, set: { value: false } });

    expect(await gate.isOpen()).toBe(false);

    await db.update(systemSettings).set({ value: true }).where(eq(systemSettings.key, 'registration_open'));

    expect(await gate.isOpen()).toBe(true);
  });

  it('LegalVersions: lấy đúng bản published_at mới nhất <= now, bỏ qua bản tương lai', async () => {
    const legal = createLegalVersions(db, () => new Date('2026-06-01T00:00:00Z'));
    const current = await legal.current();
    expect(current).toEqual({
      termsVersionId: termsId,
      privacyVersionId: privacyId,
    });
  });

  it('LegalVersions: ném lỗi nếu thiếu bản hợp lệ tại thời điểm truy vấn', async () => {
    const legal = createLegalVersions(db, () => new Date('2025-01-01T00:00:00Z'));
    await expect(legal.current()).rejects.toThrow('Thiếu văn bản pháp lý hiện hành');
  });
});
