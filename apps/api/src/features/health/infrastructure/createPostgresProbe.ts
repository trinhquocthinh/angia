import type { Pool } from 'pg';
import type { DependencyProbe } from '../application/ports.js';

export function createPostgresProbe(pool: Pool): DependencyProbe {
  return async () => {
    await pool.query('SELECT 1');
  };
}
