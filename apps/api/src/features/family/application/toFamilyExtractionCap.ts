import type { FamilyExtractionCap } from '@angia/contracts';
import type { FamilyCapRow } from './familyCapPorts.js';

// Trần hiệu lực = trần riêng nếu có, ngược lại mặc định env (SPEC-031).
export const toFamilyExtractionCap = (
  row: FamilyCapRow,
  month: string,
  defaultCapUsd: number,
): FamilyExtractionCap => ({
  familyId: row.familyId,
  familyName: row.familyName,
  month,
  capUsd: row.capUsd ?? defaultCapUsd,
  capIsDefault: row.capUsd === null,
  spentUsd: row.spentUsd,
});
