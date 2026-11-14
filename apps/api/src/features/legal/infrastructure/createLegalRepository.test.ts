import { describe, expect, it, vi } from 'vitest';
import type { Database } from '@src/shared/db/createDatabase.js';
import { createLegalRepository } from './createLegalRepository.js';

describe('Adapter legal đọc kết quả PostgreSQL', () => {
  it('TC-754: giải mã timestamp dạng chuỗi của Drizzle trước khi so ngưỡng', async () => {
    // Drizzle node-postgres giữ timestamptz của execute(sql) ở dạng chuỗi.
    const rows = (['terms', 'privacy'] as const).map((kind) => ({
      kind,
      currentPublishedAt: '2026-03-01 00:00:00+00',
      materialPublishedAt: '2026-02-01 00:00:00+00',
      acceptedPublishedAt: '2026-02-01 00:00:00+00',
    }));
    const db = { execute: vi.fn(async () => ({ rows })) } as unknown as Database;
    expect(await createLegalRepository(db).status('account')).toEqual({
      accepted: true,
      missingDocuments: false,
    });
  });
});
