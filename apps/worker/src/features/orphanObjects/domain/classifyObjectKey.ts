export type ObjectKind = 'original' | 'preview' | 'ocr' | 'unknown';

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const DOCUMENT = `profiles/${UUID}/documents/${UUID}`;
// Dạng khóa trùng documentObjectKey (API), prepareDocumentPreview và prepareOcrImage (worker).
const PATTERNS: [Exclude<ObjectKind, 'unknown'>, RegExp][] = [
  ['original', new RegExp(`^${DOCUMENT}/original\\.(jpg|png|webp|heic)$`, 'i')],
  ['preview', new RegExp(`^${DOCUMENT}/previews/${UUID}\\.webp$`, 'i')],
  ['ocr', new RegExp(`^${DOCUMENT}/ocr/${UUID}/${UUID}\\.png$`, 'i')],
];

// BR-044: chỉ khóa đúng dạng hệ thống tạo ra, thuộc đúng gia đình đang quét, mới được xét xóa.
export function classifyObjectKey(key: string, familyId: string): ObjectKind {
  const prefix = `families/${familyId}/`;
  if (!key.startsWith(prefix)) return 'unknown';
  const rest = key.slice(prefix.length);
  return PATTERNS.find(([, pattern]) => pattern.test(rest))?.[0] ?? 'unknown';
}
