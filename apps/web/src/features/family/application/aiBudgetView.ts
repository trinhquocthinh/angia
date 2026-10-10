import type { AiBudget } from './ports';

// SPEC-013: 0.00 – 100.00 USD, tối đa 2 chữ số thập phân; người Việt hay gõ dấu phẩy thập phân.
export function parseBudgetCap(input: string): number | null {
  const text = input.trim().replace(',', '.');
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(text)) return null;
  const value = Number(text);
  return value <= 100 ? value : null;
}

// Chi phí một lời gọi AI chỉ ~$0.001 nên số dưới 1 cent hiện 4 chữ số thập phân; dấu phẩy thập phân kiểu Việt Nam.
const usd = (value: number) => {
  const digits = value > 0 && value < 0.01 ? 4 : 2;
  return value.toLocaleString('vi-VN', { minimumFractionDigits: digits, maximumFractionDigits: digits });
};

// Thanh tiến độ trung tính, chỉ đổi màu từ 90% định mức (Stitch f9e3fb04).
const WARNING_PERCENT = 90;

const nextMonthStart = (month: string) => {
  const [year, value] = month.split('-').map(Number) as [number, number];
  return value === 12 ? `01/01/${year + 1}` : `01/${String(value + 1).padStart(2, '0')}/${year}`;
};

export function describeAiBudget(budget: AiBudget) {
  const [year, month] = budget.month.split('-');
  const { monthlyCapUsd: cap, spentThisMonthUsd: spent } = budget;
  const exhausted = spent >= cap;
  const percent = exhausted ? 100 : Math.round((spent / cap) * 1000) / 10;
  return {
    monthLabel: `Tháng ${month}/${year}`,
    spent: usd(spent),
    cap: usd(cap),
    remaining: usd(Math.max(cap - spent, 0)),
    percent,
    percentLabel: `${percent.toLocaleString('vi-VN')}%`,
    level: exhausted ? 'exhausted' : percent >= WARNING_PERCENT ? 'warning' : 'normal',
    resetDate: nextMonthStart(budget.month),
  } as const;
}
