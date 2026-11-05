import { AdminCardHeading } from './AdminCardHeading';
import { BudgetIcon } from './BudgetIcon';

export function AiBudgetHeader({ monthLabel }: { monthLabel: string | null }) {
  return (
    <AdminCardHeading
      id="ai-budget-title"
      icon={<BudgetIcon name="ai" size={20} />}
      title="Chi phí AI tháng này"
      aside={
        monthLabel && (
          <span className="shrink-0 rounded-full bg-[#e4f0f0] px-2.5 py-1 text-xs font-medium text-[#404945]">
            {monthLabel}
          </span>
        )
      }
    />
  );
}
