import { sql } from 'drizzle-orm';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { AiBudgetPolicy } from '../application/ports.js';
import type { AiBudgetSnapshot } from '../domain/evaluateAiBudget.js';

interface BudgetRow extends Record<string, unknown> {
  family_spent: string;
  family_cap: string;
  global_spent: string;
  global_cap: string;
}

// SPEC-031: chỉ đọc (không tạo dòng tháng). Trần tổng tháng chưa có → chép trần tháng gần nhất/mặc định như worker;
// family_extraction_spend chịu RLS nên chạy trong withFamilyScope của gia đình.
export async function readAiBudget(
  tx: FamilyScopedTx,
  familyId: string,
  month: string,
  policy: AiBudgetPolicy,
): Promise<AiBudgetSnapshot> {
  const result = await tx.execute<BudgetRow>(sql`
    SELECT
      COALESCE((SELECT spent_usd FROM family_extraction_spend WHERE family_id = ${familyId} AND month = ${month}), 0)
        AS family_spent,
      COALESCE((SELECT extraction_cap_usd FROM families WHERE id = ${familyId}), ${policy.defaultFamilyCapUsd})
        AS family_cap,
      COALESCE((SELECT spent_usd FROM extraction_spend WHERE month = ${month}), 0) AS global_spent,
      COALESCE((SELECT cap_usd FROM extraction_spend WHERE month = ${month}),
        (SELECT cap_usd FROM extraction_spend ORDER BY month DESC LIMIT 1), ${policy.defaultMonthlyCapUsd}) AS global_cap`);
  const row = result.rows[0]!;
  return {
    familySpentUsd: Number(row.family_spent),
    familyCapUsd: Number(row.family_cap),
    globalSpentUsd: Number(row.global_spent),
    globalCapUsd: Number(row.global_cap),
  };
}
