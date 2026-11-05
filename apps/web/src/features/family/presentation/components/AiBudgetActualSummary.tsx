import type { AiBudget } from '../../application/ports';
import { AiBudgetSummary } from './AiBudgetSummary';

export function AiBudgetActualSummary({ budget, actual }: { budget: AiBudget; actual: string | null }) {
  return actual !== null ? (
    <AiBudgetSummary budget={{ ...budget, spentThisMonthUsd: Number(actual) }} />
  ) : (
    <p role="status" className="m-0 rounded-xl bg-[#eaf6f5] px-3 py-2 text-[13px] leading-5 text-[#404945]">
      Chưa xác định phí thực. Xem trạng thái đối soát bên dưới.
    </p>
  );
}
