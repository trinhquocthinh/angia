import type pg from 'pg';
import { aiRoutingViewSchema } from '@angia/contracts';
import { AiRoutingError } from '../application/AiRoutingError.js';
import type { AiRoutingReader } from '../application/ports.js';

interface RoutingRow {
  version: string;
  settings: unknown;
  updated_at: Date | null;
  updated_by: string | null;
}

// Singleton phi y tế, dùng cùng pool role app; không giữ client/transaction trong khi gọi AI.
export function createAiRoutingReader(pool: Pick<pg.Pool, 'query'>): AiRoutingReader {
  return {
    read: async () => {
      let rows: RoutingRow[];
      try {
        ({ rows } = await pool.query<RoutingRow>(
          'SELECT version, settings, updated_at, updated_by FROM ai_routing_settings WHERE id = 1',
        ));
      } catch {
        throw new AiRoutingError('routing_unavailable');
      }
      try {
        const row = rows[0];
        if (!row) throw new AiRoutingError('routing_invalid');
        return aiRoutingViewSchema.parse({
          version: Number(row.version),
          settings: row.settings,
          updatedAt: row.updated_at === null ? null : row.updated_at.toISOString(),
          updatedBy: row.updated_by,
        });
      } catch {
        throw new AiRoutingError('routing_invalid');
      }
    },
  };
}
