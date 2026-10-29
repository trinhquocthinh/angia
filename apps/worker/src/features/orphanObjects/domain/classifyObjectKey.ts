export type ObjectKind = 'image' | 'original' | 'preview' | 'ocr' | 'unknown';

// Chỉ uuid không phân biệt hoa thường; phần chữ cố định và đuôi tệp phải đúng chữ thường như hệ thống ghi.
const UUID = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';
const DOCUMENT = `profiles/${UUID}/documents/${UUID}`;
// Nhận khóa JPEG hiện hành và mẫu legacy để vét object còn sót.
const PATTERNS: [Exclude<ObjectKind, 'unknown'>, RegExp][] = [
  ['image', new RegExp(`^${DOCUMENT}/upload\\.jpg$`)],
  ['image', new RegExp(`^${DOCUMENT}/images/${UUID}\\.jpg$`)],
  ['original', new RegExp(`^${DOCUMENT}/original\\.(jpg|png|webp|heic)$`)],
  ['preview', new RegExp(`^${DOCUMENT}/previews/${UUID}\\.webp$`)],
  ['ocr', new RegExp(`^${DOCUMENT}/ocr/${UUID}/${UUID}\\.png$`)],
];

// BR-044: chỉ khóa đúng dạng hệ thống tạo ra, thuộc đúng gia đình đang quét, mới được xét xóa.
export function classifyObjectKey(key: string, familyId: string): ObjectKind {
  const prefix = `families/${familyId}/`;
  if (!key.startsWith(prefix)) return 'unknown';
  const rest = key.slice(prefix.length);
  return PATTERNS.find(([, pattern]) => pattern.test(rest))?.[0] ?? 'unknown';
}
