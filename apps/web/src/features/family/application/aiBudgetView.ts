import type { AiBudget } from './ports';

// SPEC-013: 0.00 – 100.00 USD, tối đa 2 chữ số thập phân; người Việt hay gõ dấu phẩy thập phân.
export function parseBudgetCap(input: string): number | null {
  const text = input.trim().replace(',', '.');
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(text)) return null;
  const value = Number(text);
  return value <= 100 ? value : null;
}

// Chi phí một lời gọi AI chỉ ~$0.001 nên số dưới 1 cent hiện 4 chữ số thập phân.
const usd = (value: number) => `$${value.toFixed(value > 0 && value < 0.01 ? 4 : 2)}`;

export function describeAiBudget(budget: AiBudget) {
  const [year, month] = budget.month.split('-');
  const { monthlyCapUsd: cap, spentThisMonthUsd: spent } = budget;
  const exhausted = spent >= cap;
  return {
    monthLabel: `Tháng ${month}/${year}`,
    spent: usd(spent),
    cap: usd(cap),
    percent: exhausted ? 100 : Math.round((spent / cap) * 100),
    exhausted,
  };
}
