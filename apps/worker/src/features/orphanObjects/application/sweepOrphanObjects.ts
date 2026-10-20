import { classifyObjectKey } from '../domain/classifyObjectKey.js';
import type {
  FamilySweepReport,
  StoredObject,
  SweepDependencies,
  SweepPolicy,
  SweepResult,
} from './ports.js';

interface RunState {
  cutoff: number;
  removed: number;
  capped: boolean;
}

// BR-044/SPEC-032: dọn object S3 không còn được chứng từ tham chiếu, từng gia đình một.
// Liệt kê trước rồi mới đọc tham chiếu: mọi tham chiếu đã COMMIT trước lúc đọc đều được tính.
// signal: pg-boss hủy khi job hết hạn — dừng trước gia đình kế tiếp. Không ném lỗi (SPEC-032 §4).
export async function sweepOrphanObjects(
  deps: SweepDependencies,
  policy: SweepPolicy,
  signal?: AbortSignal,
): Promise<SweepResult> {
  const state: RunState = {
    cutoff: policy.now().getTime() - policy.graceHours * 3600_000,
    removed: 0,
    capped: false,
  };
  const families: FamilySweepReport[] = [];
  let familyIds: string[] = [];
  let listError: string | undefined;
  try {
    familyIds = await deps.repository.listFamilyIds();
  } catch (error) {
    listError = errorReason(error);
  }
  let aborted = false;
  for (const familyId of familyIds) {
    if (signal?.aborted) {
      aborted = true;
      break;
    }
    families.push(await sweepFamily(deps, policy, state, familyId));
    if (state.capped) break;
  }
  const sum = (field: 'scanned' | 'removed' | 'skipped' | 'failed') =>
    families.reduce((total, report) => total + report[field], 0);
  return {
    families,
    totals: {
      families: families.length,
      scanned: sum('scanned'),
      removed: sum('removed'),
      skipped: sum('skipped'),
      failed: sum('failed'),
    },
    capped: state.capped,
    aborted,
    dryRun: policy.dryRun,
    ...(listError ? { listError } : {}),
  };
}

// Chỉ mã lỗi (S3 name như AccessDenied, mã pg như 42501) — thông điệp có thể chứa khóa object.
function errorReason(error: unknown): string {
  const { code, name } = (error ?? {}) as { code?: unknown; name?: unknown };
  return String(code ?? name ?? 'unknown');
}

async function sweepFamily(
  deps: SweepDependencies,
  policy: SweepPolicy,
  state: RunState,
  familyId: string,
): Promise<FamilySweepReport> {
  const report: FamilySweepReport = {
    familyId,
    scanned: 0,
    removed: 0,
    skipped: 0,
    failed: 0,
    outcome: 'swept',
  };
  const known: StoredObject[] = [];
  let references: Set<string>;
  try {
    for await (const object of deps.storage.list(`families/${familyId}/`)) {
      report.scanned += 1;
      if (classifyObjectKey(object.key, familyId) === 'unknown') report.skipped += 1;
      else known.push(object);
    }
    references = await deps.repository.referencedKeys(familyId);
  } catch (error) {
    return { ...report, outcome: 'error', reason: errorReason(error) };
  }
  // Truy vấn trả 0 dòng do scope/RLS sai trông giống "không có tham chiếu": không xóa gì của gia đình này.
  if (references.size === 0 && known.length > 0) return { ...report, outcome: 'empty_references' };
  const candidates = known.filter(
    (object) =>
      !references.has(object.key) &&
      object.lastModified !== null &&
      object.lastModified.getTime() < state.cutoff,
  );
  for (const { key } of candidates) {
    if (state.removed >= policy.maxDeletes) {
      state.capped = true;
      break;
    }
    try {
      if (!policy.dryRun) await deps.storage.delete(key);
      report.removed += 1;
      state.removed += 1;
    } catch {
      report.failed += 1;
    }
  }
  return report;
}
