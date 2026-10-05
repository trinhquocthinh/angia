/**
 * Khóa so sánh của một giá trị trường: chuỗi bỏ khoảng trắng thừa, không phân biệt hoa/thường,
 * giữ nguyên dấu tiếng Việt; số so theo giá trị; mảng so như tập hợp; `null` là giá trị riêng.
 */
export const normalizeValue = (value: unknown): string => {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return `a:${value.map(normalizeValue).sort().join('|')}`;
  if (typeof value === 'string')
    return `s:${value.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase()}`;
  return `${typeof value}:${String(value)}`;
};
