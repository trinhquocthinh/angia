import { sql } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import type { AiRoutingRepository } from '../application/ports.js';
import { toAiRoutingView, type AiRoutingRow } from './toAiRoutingView.js';

// Singleton phi y tế: role app thực hiện DML trực tiếp, không dùng owner/đọc bảng gia đình.
export function createAiRoutingRepository(db: Database): AiRoutingRepository {
  return {
    read: async () => {
      const result = await db.execute<AiRoutingRow>(sql`
        SELECT version, settings, updated_at, updated_by FROM ai_routing_settings WHERE id = 1`);
      return toAiRoutingView(result.rows[0]);
    },
    compareAndSet: (change) =>
      db.transaction(async (tx) => {
        const result = await tx.execute<AiRoutingRow>(sql`
        UPDATE ai_routing_settings
        SET version = version + 1, settings = ${JSON.stringify(change.settings)}::jsonb,
            updated_at = ${change.updatedAt.toISOString()}::timestamptz, updated_by = ${change.updatedBy}::uuid
        WHERE id = 1 AND version = ${change.expectedVersion} AND version < 9007199254740991
        RETURNING version, settings, updated_at, updated_by`);
        const row = result.rows[0];
        if (!row) return null;
        const view = toAiRoutingView(row);
        await tx.execute(sql`
        INSERT INTO ai_routing_audit (version, settings, updated_at, updated_by)
        VALUES (${view.version}, ${JSON.stringify(view.settings)}::jsonb,
                ${view.updatedAt}::timestamptz, ${view.updatedBy}::uuid)`);
        return view;
      }),
  };
}
