import type { Pool } from 'pg';
import type { DependencyProbe } from '../application/ports.js';

export function createPostgresProbe(pool: Pool): DependencyProbe {
  return async (signal) => {
    signal?.throwIfAborted();
    const client = await pool.connect();
    let released = false;
    // pg không nhận AbortSignal: loại client sẽ đóng socket và ngắt query đang chạy.
    const abort = () => {
      released = true;
      client.release(true);
    };
    try {
      signal?.throwIfAborted();
      signal?.addEventListener('abort', abort, { once: true });
      await client.query('SELECT 1');
    } finally {
      signal?.removeEventListener('abort', abort);
      if (!released) client.release();
    }
  };
}
