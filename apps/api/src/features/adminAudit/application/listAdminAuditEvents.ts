import { adminAuditQuerySchema, type AdminAuditQuery, type AdminAuditResponse } from '@angia/contracts';
import { z } from 'zod';
import type { AdminAuditRepository } from './ports.js';

const positionSchema = z.strictObject({ at: z.iso.datetime({ offset: true }), id: z.uuid() });

export async function listAdminAuditEvents(repository: AdminAuditRepository, input: AdminAuditQuery) {
  const parsed = adminAuditQuerySchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: 'ERR_VALIDATION' } as const;
  const { cursor, ...filter } = parsed.data;
  const before = cursor === undefined ? undefined : decodeCursor(cursor);
  if (before === null) return { ok: false, code: 'ERR_VALIDATION' } as const;
  const rows = await repository.list({ ...filter, ...(before ? { before } : {}), limit: filter.limit + 1 });
  const items = rows.slice(0, filter.limit);
  const last = items.at(-1);
  const nextCursor =
    rows.length > filter.limit && last
      ? Buffer.from(JSON.stringify({ at: last.occurredAt, id: last.id })).toString('base64url')
      : null;
  const value: AdminAuditResponse = { items, nextCursor };
  return { ok: true, value } as const;
}

function decodeCursor(cursor: string) {
  try {
    if (!/^[A-Za-z0-9_-]+$/.test(cursor)) return null;
    const bytes = Buffer.from(cursor, 'base64url');
    if (bytes.toString('base64url') !== cursor) return null;
    const parsed = positionSchema.safeParse(JSON.parse(bytes.toString('utf8')));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
