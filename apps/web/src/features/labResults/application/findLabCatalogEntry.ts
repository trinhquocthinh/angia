import { normalizeMedicationName } from '@src/features/adherence/application/normalizeMedicationName';
import { LAB_CATALOG, type LabCatalogEntry, type LabGroupId } from './labCatalog';

const byAlias = new Map<string, LabCatalogEntry>(
  LAB_CATALOG.flatMap((entry) => entry.aliases.map((alias) => [alias, entry] as const)),
);

// Cùng chuẩn hóa tên của SPEC-021, thêm bỏ dấu câu cuối và khoảng trắng quanh "-" ("HDL - C" ≡ "HDL-C").
const normalize = (name: string) =>
  normalizeMedicationName(name)
    .replace(/\s*-\s*/g, '-')
    .replace(/[.:]+$/, '')
    .trim();

// Thứ tự khớp: cả tên → tên bỏ phần trong ngoặc → từng phần trong ngoặc ("AST (GOT)", "Glucose (máu)").
function candidates(testName: string): string[] {
  const name = normalize(testName);
  const inner = [...name.matchAll(/\(([^)]*)\)/g)].map((match) => normalize(match[1]!));
  return [name, normalize(name.replace(/\([^)]*\)/g, ' ')), ...inner];
}

// Tra nhóm cơ quan và ghi chú trung tính theo tên chỉ số trên phiếu; không khớp → "Khác", không ghi chú.
export function findLabCatalogEntry(testName: string): { group: LabGroupId; note: string | null } {
  for (const candidate of candidates(testName)) {
    const entry = byAlias.get(candidate);
    if (entry) return { group: entry.group, note: entry.note };
  }
  return { group: 'other', note: null };
}
