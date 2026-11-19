// SPEC-070: tuổi giám hộ dưới 18, khác ngưỡng hiển thị số đo dưới 16 của BR-049.
export function needsProfileGuardian(birthYear: number | null, linked: boolean, now: Date): boolean {
  const year = Number(
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric' }).format(now),
  );
  return birthYear !== null && year - birthYear < 18 && !linked;
}
