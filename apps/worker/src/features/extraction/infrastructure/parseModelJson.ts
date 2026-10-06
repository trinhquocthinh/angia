import { type ExtractionPayload, extractionPayloadSchema } from '@angia/contracts';

export type ParseResult =
  { ok: true; payload: ExtractionPayload } | { ok: false; reason: 'invalid_json' | 'schema_mismatch' };

const FENCED_JSON = /```(?:json)?\s*([\s\S]*?)```/;

/** Đọc phản hồi model thành payload SDD §2.1; sai định dạng thì báo lỗi, không đoán (SPEC-009). */
export const parseModelJson = (content: string): ParseResult => {
  const raw = FENCED_JSON.exec(content)?.[1] ?? content;
  let json: unknown;
  try {
    json = JSON.parse(raw.trim());
  } catch {
    return { ok: false, reason: 'invalid_json' };
  }
  const parsed = extractionPayloadSchema.safeParse(json);
  return parsed.success ? { ok: true, payload: parsed.data } : { ok: false, reason: 'schema_mismatch' };
};
