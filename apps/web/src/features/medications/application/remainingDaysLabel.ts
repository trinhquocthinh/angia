const DAY = 24 * 60 * 60 * 1000;
const utcDay = (isoDate: string) => Date.parse(`${isoDate}T00:00:00Z`);

// Chủ dự án chốt 2026-10-11: tính cả hôm nay (ngày cuối hiệu lực là "Còn 1 ngày"); endDate null là Dài hạn.
// today là ngày Việt Nam do server trả; đợt trong danh mục luôn có endDate ≥ today (SPEC-018).
export function remainingDaysLabel(endDate: string | null, today: string): string {
  if (endDate === null) return 'Dài hạn';
  return `Còn ${Math.round((utcDay(endDate) - utcDay(today)) / DAY) + 1} ngày`;
}
