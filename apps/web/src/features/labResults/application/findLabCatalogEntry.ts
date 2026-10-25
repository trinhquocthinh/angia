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

// Mẫu nước tiểu hoặc mã ngắn dùng chung cho máu và nước tiểu: chỉ chấp nhận khớp vào nhóm "Nước tiểu".
const URINE_CONTEXT = /(^|[^a-z0-9])(nieu|nuoc tieu|glu|pro|bld|leu|bil|ery|ph)([^a-z0-9]|$)/;

// Thứ tự khớp: cả tên → tên giữ nội dung ngoặc ("Glucose (nước tiểu)" → "glucose nuoc tieu")
// → tên bỏ phần trong ngoặc → từng phần trong ngoặc ("AST (GOT)", "Glucose (máu)").
function candidates(name: string): string[] {
  const inner = [...name.matchAll(/\(([^)]*)\)/g)].map((match) => normalize(match[1]!));
  return [name, normalize(name.replace(/[()]/g, ' ')), normalize(name.replace(/\([^)]*\)/g, ' ')), ...inner];
}

// Tra nhóm cơ quan và ghi chú trung tính theo tên chỉ số trên phiếu; không khớp chắc chắn → "Khác", không ghi chú.
export function findLabCatalogEntry(testName: string): { group: LabGroupId; note: string | null } {
  const name = normalize(testName);
  const urineOnly = URINE_CONTEXT.test(name);
  for (const candidate of candidates(name)) {
    const entry = byAlias.get(candidate);
    if (entry && (!urineOnly || entry.group === 'urine')) return { group: entry.group, note: entry.note };
  }
  return { group: 'other', note: null };
}
