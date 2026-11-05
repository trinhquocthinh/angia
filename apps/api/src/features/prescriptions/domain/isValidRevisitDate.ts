const DAY_MS = 86_400_000;

// BR-051: ngày in trên đơn, tính khoảng ngày theo UTC để không phụ thuộc múi giờ/DST.
export function isValidRevisitDate(issuedDate: string, revisitDate: string | null): boolean {
  if (revisitDate === null) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(revisitDate)) return false;
  const revisit = Date.parse(`${revisitDate}T00:00:00Z`);
  if (!Number.isFinite(revisit) || new Date(revisit).toISOString().slice(0, 10) !== revisitDate) return false;
  const days = (revisit - Date.parse(`${issuedDate}T00:00:00Z`)) / DAY_MS;
  return days >= 0 && days <= 3650;
}
