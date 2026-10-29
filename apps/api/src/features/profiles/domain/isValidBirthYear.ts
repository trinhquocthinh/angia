export function isValidBirthYear(year: number, now: Date): boolean {
  const currentYear = Number(
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric' }).format(now),
  );
  return Number.isInteger(year) && year >= 1900 && year <= currentYear;
}
