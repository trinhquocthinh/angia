export type RangeFlag = 'above' | 'below' | null;

const N = String.raw`\d+(?:[.,]\d+)?`;
const BETWEEN = new RegExp(String.raw`^(${N})\s*[-–—~]\s*(${N})$`);
const UPPER = new RegExp(String.raw`^(<=|≤|<)\s*(${N})$`);
const LOWER = new RegExp(String.raw`^(>=|≥|>)\s*(${N})$`);
const VALUE = new RegExp(`^${N}$`);
// "250.000" / "10,000": không phân biệt được dấu thập phân với dấu hàng nghìn → không đoán.
const AMBIGUOUS = /\d[.,]\d{3}(?!\d)/;

const stripUnit = (text: string, unit: string | null) => {
  const trimmed = text.trim();
  if (!unit || !trimmed.toLowerCase().endsWith(unit.trim().toLowerCase())) return trimmed;
  return trimmed.slice(0, trimmed.length - unit.trim().length).trim();
};
const toNumber = (text: string) => Number(text.replace(',', '.'));

function compareBetween(value: number, low: number, high: number): RangeFlag {
  if (low > high) return null;
  if (value > high) return 'above';
  return value < low ? 'below' : null;
}

function compareBound(value: number, operator: string, bound: number): RangeFlag {
  if (operator === '<') return value >= bound ? 'above' : null;
  if (operator === '<=' || operator === '≤') return value > bound ? 'above' : null;
  if (operator === '>') return value <= bound ? 'below' : null;
  return value < bound ? 'below' : null;
}

// So giá trị với khoảng tham chiếu in trên chính phiếu (BR-022, BR-033 làm rõ 2026-10-25).
// Chỉ đánh dấu khi đọc chắc chắn được; mọi trường hợp mơ hồ trả null (không đánh dấu).
export function compareToPrintedRange(
  value: string,
  referenceRange: string | null,
  unit: string | null,
): RangeFlag {
  if (referenceRange === null) return null;
  const rawValue = stripUnit(value, unit);
  const range = stripUnit(referenceRange, unit)
    .replace(/^\((.*)\)$/, '$1')
    .trim();
  if (!VALUE.test(rawValue) || AMBIGUOUS.test(rawValue) || AMBIGUOUS.test(range)) return null;
  const number = toNumber(rawValue);
  const between = BETWEEN.exec(range);
  if (between) return compareBetween(number, toNumber(between[1]!), toNumber(between[2]!));
  const bound = UPPER.exec(range) ?? LOWER.exec(range);
  return bound ? compareBound(number, bound[1]!, toNumber(bound[2]!)) : null;
}
