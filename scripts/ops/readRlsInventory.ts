import type pg from 'pg';
import { RLS_INVENTORY_QUERIES } from './rlsInventoryQueries.js';

export async function readRlsInventory(client: pg.ClientBase) {
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  try {
    await client.query("SET LOCAL statement_timeout = '10s'");
    const sections: Record<string, pg.QueryResultRow[]> = {};
    for (const [name, query] of Object.entries(RLS_INVENTORY_QUERIES)) {
      sections[name] = (await client.query(query)).rows;
    }
    await client.query('COMMIT');
    return {
      format: 'angia-rls-inventory/1',
      generatedAt: new Date().toISOString(),
      ...sections,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
