import type { EntryCursor } from './DocumentEntry.js';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
// Thời điểm lưu giữ đủ micro giây của PostgreSQL để keyset không bỏ sót bản cùng mili giây.
const CREATED_KEY = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isCalendarDate(value: string): boolean {
  return DATE.test(value) && new Date(`${value}T00:00:00Z`).toISOString().startsWith(value);
}

// SPEC-028: cursor mờ (base64url JSON) của mục cuối trang trước.
export function encodeEntryCursor(cursor: EntryCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}

export function decodeEntryCursor(raw: string): EntryCursor | null {
  try {
    const value: unknown = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
    const { entryDate, createdKey, id, ...rest } = value as Record<string, unknown>;
    if (Object.keys(rest).length > 0) return null;
    if (typeof entryDate !== 'string' || !isCalendarDate(entryDate)) return null;
    if (typeof createdKey !== 'string' || !CREATED_KEY.test(createdKey)) return null;
    if (typeof id !== 'string' || !UUID.test(id)) return null;
    return { entryDate, createdKey, id };
  } catch {
    return null;
  }
}
