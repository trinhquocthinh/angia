import type { AiBudget } from '../../application/ports';
import { AiBudgetSummary } from './AiBudgetSummary';

export function AiBudgetActualSummary({ budget, actual }: { budget: AiBudget; actual: string | null }) {
  return actual !== null ? (
    <AiBudgetSummary budget={{ ...budget, spentThisMonthUsd: Number(actual) }} />
  ) : (
    <p role="status">Chưa xác định phí thực. Xem trạng thái đối soát bên dưới.</p>
  );
}
