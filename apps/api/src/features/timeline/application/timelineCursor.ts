import { timelineCursorSchema, type TimelineCursor } from '@angia/contracts';

export function encodeTimelineCursor({ date, time, kind, id }: TimelineCursor): string {
  return Buffer.from(JSON.stringify({ date, time, kind, id })).toString('base64url');
}

export function decodeTimelineCursor(raw: string): TimelineCursor | null {
  if (raw.length > 1024 || !/^[A-Za-z0-9_-]+$/.test(raw)) return null;
  try {
    const bytes = Buffer.from(raw, 'base64url');
    if (bytes.toString('base64url') !== raw) return null;
    const result = timelineCursorSchema.safeParse(JSON.parse(bytes.toString('utf8')));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
