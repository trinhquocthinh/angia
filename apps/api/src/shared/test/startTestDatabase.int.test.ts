import { describe, expect, it } from 'vitest';
import pg from 'pg';
import { startTestDatabase } from './startTestDatabase.js';

describe('startTestDatabase', () => {
  it('container.stop() chờ client đang đóng ngắt hẳn rồi mới tắt PostgreSQL, không phát lỗi 57P01', async () => {
    const db = await startTestDatabase();
    const client = new pg.Client({ connectionString: db.appUrl });
    await client.connect();
    await client.query('SELECT 1');

    const errors: unknown[] = [];
    client.on('error', (e) => errors.push(e));
    const ended = new Promise<void>((resolve) => setTimeout(() => void client.end().then(resolve), 300)); // Đóng trễ như socket chưa kịp đóng.

    await db.container.stop();
    await ended;

    expect(errors).toEqual([]);
  }, 120_000);
});
